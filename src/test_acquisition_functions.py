import pytest

import torch

import sampler_model
import torch.utils.data

from torchvision import datasets, transforms

import itertools

import acquisition_functions
import mnist_model


# NOTE: we could replace this with a custom dataset if it becomes a problem on Jekyll.


def test_random_acquistion_function():
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

    estimator = acquisition_functions.RandomAcquisitionFunction()
    estimator.eval()

    scores = torch.tensor([])

    num_iters = 5
    for data, _ in itertools.islice(test_loader, num_iters):
        output = estimator(data)
        scores = torch.cat((scores, output), dim=0)

    assert scores.shape == (batch_size * num_iters,)


@pytest.mark.parametrize("acquisition_function", acquisition_functions.AcquisitionFunction)
def test_acquisition_functions(acquisition_function: acquisition_functions.AcquisitionFunction):
    batch_size = 13

    test_loader = torch.utils.data.DataLoader(
        datasets.MNIST(
            "../data",
            train=False,
            transform=transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))]),
        ),
        batch_size=batch_size,
        shuffle=False,
    )

    bayesian_net = mnist_model.BayesianNet()

    estimator = acquisition_function.create(bayesian_net, k=1)
    estimator.eval()

    scores = torch.tensor([])

    num_iters = 5
    for data, _ in itertools.islice(test_loader, num_iters):
        output = estimator(data)
        scores = torch.cat((scores, output), dim=0)

    assert scores.shape == (batch_size * num_iters,)


@pytest.mark.parametrize("af_type", acquisition_functions.AcquisitionFunction)
def test_check_input_permutation(af_type: acquisition_functions.AcquisitionFunction):
    if af_type == acquisition_functions.AcquisitionFunction.random:
        return

    batch_size = 12

    test_data = torch.rand((batch_size, 10))

    mixture_a = test_data[::2, :]
    mixture_b = test_data[1::2, :]
    mixture_c = test_data

    class Forwarder(torch.nn.Module):
        def forward(self, batch):
            return batch

    forwarder = Forwarder()
    estimator = af_type.create(forwarder, k=1)
    estimator.eval()

    output_a = estimator(mixture_a)
    output_b = estimator(mixture_b)
    output_c = estimator(mixture_c)

    torch.testing.assert_allclose(
        torch.cat([output_a, output_b], dim=0), torch.cat([output_c[::2], output_c[1::2]], dim=0)
    )
