from __future__ import print_function
import torch
from torch import jit

import collections
import numpy as np
import math
import typing
import gc

from torch.utils.data import Subset, Dataset

DEBUG_CHECKS = False


def gc_cuda():
    gc.collect()
    torch.cuda.empty_cache()


def get_cuda_total_memory():
    return torch.cuda.get_device_properties(0).total_memory


def _get_cuda_assumed_available_memory():
    return get_cuda_total_memory() - torch.cuda.memory_cached()


def get_cuda_available_memory():
    # Always allow for 1 GB overhead.
    return _get_cuda_assumed_available_memory() - get_cuda_blocked_memory()


def get_cuda_blocked_memory():
    # In GB steps
    available_memory = _get_cuda_assumed_available_memory()
    current_block = available_memory - 2 ** 30
    while True:
        try:
            block = torch.empty((current_block,), dtype=torch.uint8, device="cuda")
            break
        except RuntimeError as exception:
            if is_cuda_out_of_memory(exception):
                current_block -= 2 ** 30
                if current_block <= 0:
                    return available_memory
            else:
                raise
    block = None
    gc_cuda()
    return available_memory - current_block


def is_cuda_out_of_memory(exception):
    return (
        isinstance(exception, RuntimeError) and len(exception.args) == 1 and "CUDA out of memory." in exception.args[0]
    )


def is_cudnn_snafu(exception):
    # For/because of https://github.com/pytorch/pytorch/issues/4107
    return (
        isinstance(exception, RuntimeError)
        and len(exception.args) == 1
        and "cuDNN error: CUDNN_STATUS_NOT_SUPPORTED." in exception.args[0]
    )


def should_reduce_batch_size(exception):
    return is_cuda_out_of_memory(exception) or is_cudnn_snafu(exception)


def cuda_meminfo():
    print("Total:", torch.cuda.memory_allocated() / 2 ** 30, " GB Cached: ", torch.cuda.memory_cached() / 2 ** 30, "GB")
    print(
        "Max Total:",
        torch.cuda.max_memory_allocated() / 2 ** 30,
        " GB Max Cached: ",
        torch.cuda.max_memory_cached() / 2 ** 30,
        "GB",
    )


@jit.script
def logit_mean(logits, dim: int, keepdim: bool = False):
    r"""Computes $\log \left ( \frac{1}{n} \sum_i p_i \right ) =
    \log \left ( \frac{1}{n} \sum_i e^{\log p_i} \right )$.

    We pass in logits.
    """
    return torch.logsumexp(logits, dim=dim, keepdim=keepdim) - math.log(logits.shape[dim])


@jit.script
def entropy(logits, dim: int, keepdim: bool = False):
    return -torch.sum((torch.exp(logits) * logits).double(), dim=dim, keepdim=keepdim)


@jit.script
def mutual_information(logits_B_K_C):
    sample_entropies_B_K = entropy(logits_B_K_C, dim=-1)
    entropy_mean_B = torch.mean(sample_entropies_B_K, dim=1)

    logits_mean_B_C = logit_mean(logits_B_K_C, dim=1)
    mean_entropy_B = entropy(logits_mean_B_C, dim=-1)

    mutual_info_B = mean_entropy_B - entropy_mean_B
    return mutual_info_B


@jit.script
def mean_stddev(logits_B_K_C):
    stddev_B_C = torch.std(torch.exp(logits_B_K_C).double(), dim=1, keepdim=True).squeeze(1)
    return torch.mean(stddev_B_C, dim=1, keepdim=True).squeeze(1)


def partition_dataset(dataset: np.ndarray, mask):
    return dataset[mask], dataset[~mask]


def get_balanced_sample_indices(target_classes: typing.List, num_classes, n_per_digit=2) -> typing.Dict[int, list]:
    permed_indices = torch.randperm(len(target_classes))

    initial_samples_by_class = collections.defaultdict(list)
    if n_per_digit == 0:
        return initial_samples_by_class

    finished_classes = 0
    for i in range(len(permed_indices)):
        permed_index = int(permed_indices[i])
        index, target = permed_index, int(target_classes[permed_index])

        target_indices = initial_samples_by_class[target]
        if len(target_indices) == n_per_digit:
            continue

        target_indices.append(index)
        if len(target_indices) == n_per_digit:
            finished_classes += 1

        if finished_classes == num_classes:
            break

    return dict(initial_samples_by_class)


def get_subset_base_indices(dataset: Subset, indices: typing.List[int]):
    return [int(dataset.indices[index]) for index in indices]


def get_base_indices(dataset: Dataset, indices: typing.List[int]):
    if isinstance(dataset, Subset):
        return get_base_indices(dataset.dataset, get_subset_base_indices(dataset, indices))
    return indices


#### ADDED FOR HEURISTIC
@jit.script
def batch_jsd(batch_p, q):
    """
    :param batch_p: #batch x #classes
    :param q: #classes
    :return: #batch Jensen-Shannon Divergences
    """
    assert len(batch_p.shape) == 2
    assert len(batch_p.shape) == 2

    # expanded_q: 1 x #classes
    expanded_q = q[None, :]

    # p, q: #batch x #classes
    lhs = -batch_p * torch.log(1.0 + expanded_q / batch_p)
    rhs = -expanded_q * torch.log(1.0 + batch_p / expanded_q)
    # lim_x->0 x*ln(1+1/x) = 0
    lhs[(batch_p == 0).expand_as(lhs)] = torch.tensor(0.0)
    rhs[(expanded_q == 0).expand_as(rhs)] = torch.tensor(0.0)

    lhs = lhs.sum(dim=1)
    rhs = rhs.sum(dim=1)

    jsd = 0.5 * (lhs + rhs) + math.log(2)

    return jsd


@jit.script
def batch_multi_choices(probs_b_C, M: int):
    """
    probs_b_C: Ni... x C

    Returns:
        choices: Ni... x M
    """
    probs_B_C = probs_b_C.reshape((-1, probs_b_C.shape[-1]))

    # samples: Ni... x draw_per_xx
    choices = torch.multinomial(probs_B_C, num_samples=M, replacement=True)

    choices_b_M = choices.reshape(list(probs_b_C.shape[:-1]) + [M])
    return choices_b_M


def gather_expand(data, dim, index):
    if DEBUG_CHECKS:
        assert len(data.shape) == len(index.shape)
        assert all(dr == ir or 1 in (dr, ir) for dr, ir in zip(data.shape, index.shape))

    max_shape = [max(dr, ir) for dr, ir in zip(data.shape, index.shape)]
    new_data_shape = list(max_shape)
    new_data_shape[dim] = data.shape[dim]

    new_index_shape = list(max_shape)
    new_index_shape[dim] = index.shape[dim]

    data = data.expand(new_data_shape)
    index = index.expand(new_index_shape)

    return torch.gather(data, dim, index)


def split_tensors(output, input, chunk_size):
    assert len(output) == len(input)
    return list(zip(output.split(chunk_size), input.split(chunk_size)))
