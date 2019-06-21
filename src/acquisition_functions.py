import torch
from blackhc.progress_bar import with_progress_bar

import torch_utils

import enum


def random_acquisition_function(logits_b_K_C):
    # If we use this together with a heuristic, make it small, so the heuristic takes over after the
    # first random pick.
    return torch.rand(logits_b_K_C.shape[0], device=logits_b_K_C.device) * 0.00001


def variation_ratios(logits_b_K_C):
    # torch.max yields a tuple with (max, argmax).
    return torch.ones(logits_b_K_C.shape[0], dtype=logits_b_K_C.dtype, device=logits_b_K_C.device) - torch.exp(
        torch.max(torch_utils.logit_mean(logits_b_K_C, dim=1, keepdim=False), dim=1, keepdim=False)[0]
    )


def mean_stddev_acquisition_function(logits_b_K_C):
    return torch_utils.mean_stddev(logits_b_K_C)


def max_entropy_acquisition_function(logits_b_K_C):
    return torch_utils.entropy(torch_utils.logit_mean(logits_b_K_C, dim=1, keepdim=False), dim=-1)


def bald_acquisition_function(logits_b_K_C):
    return torch_utils.mutual_information(logits_b_K_C)


class AcquisitionFunction(enum.Enum):
    random = "random"
    predictive_entropy = "predictive_entropy"
    bald = "bald"
    variation_ratios = "variation_ratios"
    mean_stddev = "mean_stddev"

    @property
    def scorer(self):
        if self == AcquisitionFunction.random:
            return random_acquisition_function
        elif self == AcquisitionFunction.predictive_entropy:
            return max_entropy_acquisition_function
        elif self == AcquisitionFunction.bald:
            return bald_acquisition_function
        elif self == AcquisitionFunction.variation_ratios:
            return variation_ratios
        elif self == AcquisitionFunction.mean_stddev:
            return mean_stddev_acquisition_function
        else:
            return NotImplementedError(f"{self} not supported yet!")

    def compute_scores(self, logits_B_K_C, available_loader, device):
        scorer = self.scorer

        if self == AcquisitionFunction.random:
            return scorer(logits_B_K_C, None).double()

        B, K, C = logits_B_K_C.shape

        # We need to sample the predictions from the bayesian_model n times and store them.
        with torch.no_grad():
            scores_B = torch.empty((B,), dtype=torch.float64)

            if device.type == "cuda":
                torch_utils.gc_cuda()
                KC_memory = K * C * 8
                batch_size = min(torch_utils.get_cuda_available_memory() // KC_memory, 8192)
            else:
                batch_size = 4096

            for scores_b, logits_b_K_C in with_progress_bar(
                torch_utils.split_tensors(scores_B, logits_B_K_C, batch_size), unit_scale=batch_size
            ):
                scores_b.copy_(scorer(logits_b_K_C.to(device)), non_blocking=True)

        return scores_B
