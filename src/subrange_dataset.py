from torch.utils.data import Subset
import numpy as np


# TODO: I fucked this one up. Get rid of this again. (Need the range here to support slicing!)
def SubrangeDataset(dataset, begin, end):
    if end > len(dataset):
        end = len(dataset)
    return Subset(dataset, range(begin, end))


def dataset_subset_split(dataset, indices):
    if isinstance(indices, int):
        indices = [indices]

    datasets = []

    last_index = 0
    for index in indices:
        datasets.append(SubrangeDataset(dataset, last_index, index))
        last_index = index
    datasets.append(SubrangeDataset(dataset, last_index, len(dataset)))

    return datasets
