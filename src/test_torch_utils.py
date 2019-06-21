import pytest

import numpy as np
import torch
import torch_utils


def test_get_balanced_samples():
    labels = torch.randint(0, 47, (1000000,))
    ranges = torch_utils.get_balanced_sample_indices(labels, 47, 2)

    for digit, samples in ranges.items():
        assert len(samples) == 2, f"Failed for digit class {digit}"
        assert all(labels[samples] == digit), f"Failed for digit class {digit}"


def test_partition_dataset():
    dataset = np.ones((5, 5))
    result = torch_utils.partition_dataset(dataset, np.array([True, False, False, True, True]))
    assert result[0].shape == (3, 5)
    assert result[1].shape == (2, 5)
