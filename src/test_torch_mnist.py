import pytest

import numpy as np
import torch
import torch_utils
import torch_mnist
import torch.utils.data

from torchvision import datasets, transforms

import itertools


def test_find_additional_labels():
    batch_size = 10

    test_loader = torch.utils.data.DataLoader(
        datasets.MNIST(
            "../data",
            train=False,
            transform=transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))]),
        ),
        batch_size=batch_size,
        shuffle=False,
    )

    net = torch_mnist.BayesianNet()
    estimator = torch_mnist.BALDEstimator(net, n=10)
    estimator.eval()

    scores = torch.tensor([])

    num_iters = 5
    for data, _ in itertools.islice(test_loader, num_iters):
        output = estimator(data)
        scores = torch.cat((scores, output), dim=0)

    assert scores.shape == (batch_size * num_iters,)
