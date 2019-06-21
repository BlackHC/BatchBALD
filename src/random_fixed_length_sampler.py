import torch
from torch.utils import data as data


class RandomFixedLengthSampler(data.Sampler):
    """
    Sometimes, you really want to do more with little data without increasing the number of epochs.

    This sampler takes a `dataset` and draws `target_length` samples from it (with repetition).
    """

    def __init__(self, dataset: data.Dataset, target_length):
        super().__init__(dataset)
        self.dataset = dataset
        self.target_length = target_length

    def __iter__(self):
        # Ensure that we don't lose data by accident.
        if self.target_length < len(self.dataset):
            return iter(range(len(self.dataset)))

        return iter((torch.randperm(self.target_length) % len(self.dataset)).tolist())

    def __len__(self):
        return self.target_length
