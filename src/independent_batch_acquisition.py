import torch.nn as nn
import torch
import numpy as np

from acquisition_batch import AcquisitionBatch
from reduced_consistent_mc_sampler import reduced_eval_consistent_bayesian_model
from acquisition_functions import AcquisitionFunction


def get_top_n(scores: np.ndarray, n):
    top_n = np.argpartition(scores, -n)[-n:]
    return top_n


def compute_acquisition_bag(
    bayesian_model: nn.Module,
    acquisition_function: AcquisitionFunction,
    available_loader,
    num_classes: int,
    k: int,
    b: int,
    initial_percentage: int,
    reduce_percentage: int,
    device=None,
) -> AcquisitionBatch:
    if acquisition_function != AcquisitionFunction.random:
        result = reduced_eval_consistent_bayesian_model(
            bayesian_model=bayesian_model,
            acquisition_function=acquisition_function,
            num_classes=num_classes,
            k=k,
            initial_percentage=initial_percentage,
            reduce_percentage=reduce_percentage,
            target_size=b,
            available_loader=available_loader,
            device=device,
        )

        scores_B = result.scores_B
        subset_split = result.subset_split
        result = None

        top_k_scores, top_k_indices = scores_B.topk(b, largest=True, sorted=True)

        top_k_scores = top_k_scores.numpy()

        # Map our indices to the available_loader dataset.
        top_k_indices = subset_split.get_dataset_indices(top_k_indices.numpy())

        print(f"Acquisition bag: {top_k_indices}")
        print(f"Scores: {top_k_scores}")

        return AcquisitionBatch(top_k_indices, top_k_scores, None)
    else:
        picked_indices = torch.randperm(len(available_loader.dataset))[:b].numpy()

        print(f"Acquisition bag: {picked_indices}")

        return AcquisitionBatch(picked_indices, [0.0] * b, None)
