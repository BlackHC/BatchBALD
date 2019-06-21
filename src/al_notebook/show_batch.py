import blackhc.notebook

import torchvision
import matplotlib.pyplot as plt
import numpy as np
from torchvision import datasets, transforms
import torch


def mnist_train():
    return datasets.MNIST(
        "data",
        train=True,
        download=True,
        transform=transforms.Compose(
            [
                transforms.ToTensor(),
                # transforms.Normalize((0.1307,), (0.3081,))
                # transforms.
            ]
        ),
    )


def mnist_test():
    return datasets.MNIST(
        "data",
        train=False,
        download=True,
        transform=transforms.Compose(
            [
                transforms.ToTensor(),
                # transforms.Normalize((0.1307,), (0.3081,))
                # transforms.
            ]
        ),
    )


def show_batch(batch, **kwargs):
    im = torchvision.utils.make_grid(batch, **kwargs)
    plt.imshow(np.transpose(im.numpy(), (1, 2, 0)))


def show_indices(dataset, indices, **kwargs):
    batch = [dataset[index][0] for index in indices]
    batch = torch.stack(batch)
    show_batch(batch)
