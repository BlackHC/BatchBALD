import acquisition_functions

# TODO(blackhc): extract AcquisitionMethod and DatasetEnum
import acquisition_method
import dataset_enum

import torch
from torch import nn

import torch.utils.data as data

from random_fixed_length_sampler import RandomFixedLengthSampler
from train_model import train_model
from active_learning_data import ActiveLearningData
from collections import namedtuple
from typing import NamedTuple


class Loaders(NamedTuple):
    train: data.DataLoader
    test: data.DataLoader
    validation: data.DataLoader


class RecoveredModel(NamedTuple):
    args: tuple
    model: nn.Module
    num_epochs: int
    test_metrics: dict
    active_learning_data: ActiveLearningData
    validation_dataset: data.Dataset
    test_dataset: data.Dataset
    loaders: Loaders


def get_samples_from_laaos_store(laaos_store, target_iteration=None):
    samples = []
    samples.extend(laaos_store["initial_samples"])

    for iteration in laaos_store["iterations"][:target_iteration]:
        samples.extend(iteration["chosen_samples"])

    return samples


# Because Python sucks.
def parse_enum_str(enum_str: str, enum_cls):
    value = enum_str.split(".", 1)[1]
    return enum_cls[value]


# TODO: deduplicate with al_notebook.results_loader
def recover_args(laaos_store) -> namedtuple:
    args = dict(laaos_store["args"])
    # Recover enums
    args["type"] = parse_enum_str(args["type"], acquisition_functions.AcquisitionFunction)

    if "acquisition_method" in args:
        args["acquisition_method"] = parse_enum_str(args["acquisition_method"], acquisition_method.AcquisitionMethod)
    else:
        args["acquisition_method"] = acquisition_method.AcquisitionMethod.independent

    if "dataset" in args:
        args["dataset"] = parse_enum_str(args["dataset"], dataset_enum.DatasetEnum)
    else:
        args["dataset"] = dataset_enum.DatasetEnum.mnist

    return namedtuple("args", args.keys())(*args.values())


def recover_model(laaos_store, target_iteration=None):
    args = recover_args(laaos_store)
    sample_indices = get_samples_from_laaos_store(laaos_store, target_iteration)

    use_cuda = not args.no_cuda and torch.cuda.is_available()

    torch.manual_seed(args.seed)

    device = torch.device("cuda" if use_cuda else "cpu")

    print(f"Using {device} for computations")

    kwargs = {"num_workers": 1, "pin_memory": True} if use_cuda else {}

    dataset: dataset_enum.DatasetEnum = args.dataset
    experiment_data = dataset_enum.get_experiment_data(
        dataset.get_data_source(),
        dataset.num_classes,
        sample_indices,
        False,
        0,
        args.validation_set_size,
        args.balanced_test_set,
        args.balanced_validation_set,
    )

    test_loader = torch.utils.data.DataLoader(
        experiment_data.test_dataset, batch_size=args.test_batch_size, shuffle=False, **kwargs
    )

    train_loader = torch.utils.data.DataLoader(
        experiment_data.train_dataset,
        sampler=RandomFixedLengthSampler(experiment_data.train_dataset, args.epoch_samples),
        batch_size=args.batch_size,
        **kwargs,
    )

    validation_loader = torch.utils.data.DataLoader(
        experiment_data.validation_dataset, batch_size=args.test_batch_size, shuffle=False, **kwargs
    )

    log_interval = args.log_interval
    num_inference_samples = args.num_inference_samples
    early_stopping_patience = args.early_stopping_patience
    max_epochs = args.epochs

    def desc(name):
        return lambda engine: "%s" % name

    model, num_epochs, test_metrics = dataset.train_model(
        train_loader,
        test_loader,
        validation_loader,
        num_inference_samples,
        max_epochs,
        early_stopping_patience,
        desc,
        log_interval,
        device,
    )

    return RecoveredModel(
        args,
        model,
        num_epochs,
        test_metrics,
        experiment_data.active_learning_data,
        experiment_data.validation_dataset,
        experiment_data.test_dataset,
        Loaders(train_loader, test_loader, validation_loader),
    )
