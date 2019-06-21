from dataclasses import dataclass
import collections
import enum
import itertools

from torch import optim
from torch.utils.data import Dataset
from torchvision import datasets, transforms
import torch.utils.data as data
import torch

from typing import List

import mnist_model
import emnist_model
from active_learning_data import ActiveLearningData
from torch_utils import get_balanced_sample_indices
from train_model import train_model
from transformed_dataset import TransformedDataset
import subrange_dataset


@dataclass
class ExperimentData:
    active_learning_data: ActiveLearningData
    train_dataset: Dataset
    available_dataset: Dataset
    validation_dataset: Dataset
    test_dataset: Dataset
    initial_samples: List[int]


@dataclass
class DataSource:
    train_dataset: Dataset
    validation_dataset: Dataset = None
    test_dataset: Dataset = None
    shared_transform: object = None
    train_transform: object = None
    scoring_transform: object = None


def get_MNIST():
    # num_classes=10, input_size=28
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    train_dataset = datasets.MNIST("data", train=True, download=True, transform=transform)
    test_dataset = datasets.MNIST("data", train=False, transform=transform)

    return DataSource(train_dataset=train_dataset, test_dataset=test_dataset)


def get_RepeatedMNIST():
    # num_classes = 10, input_size = 28
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    org_train_dataset = datasets.MNIST("data", train=True, download=True, transform=transform)
    train_dataset = data.ConcatDataset([org_train_dataset] * 3)

    test_dataset = datasets.MNIST("data", train=False, transform=transform)
    return DataSource(train_dataset=train_dataset, test_dataset=test_dataset)


class DatasetEnum(enum.Enum):
    mnist = "mnist"
    emnist = "emnist"
    emnist_bymerge = "emnist_bymerge"
    repeated_mnist_w_noise = "repeated_mnist_w_noise"
    mnist_w_noise = "mnist_w_noise"

    def get_data_source(self):
        if self == DatasetEnum.mnist:
            return get_MNIST()
        elif self in (DatasetEnum.repeated_mnist_w_noise, DatasetEnum.mnist_w_noise):
            # num_classes=10, input_size=28
            num_repetitions = 3 if self == DatasetEnum.repeated_mnist_w_noise else 1

            transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
            org_train_dataset = datasets.MNIST("data", train=True, download=True, transform=transform)

            def apply_noise(idx, sample):
                data, target = sample
                return data + dataset_noise[idx], target

            dataset_noise = torch.empty(
                (len(org_train_dataset) * num_repetitions, 28, 28), dtype=torch.float32
            ).normal_(0.0, 0.1)

            train_dataset = TransformedDataset(
                data.ConcatDataset([org_train_dataset] * num_repetitions), transformer=apply_noise
            )

            test_dataset = datasets.MNIST("data", train=False, transform=transform)

            return DataSource(train_dataset=train_dataset, test_dataset=test_dataset)
        elif self in (DatasetEnum.emnist, DatasetEnum.emnist_bymerge):
            # num_classes=47, input_size=28,
            split = "balanced" if self == DatasetEnum.emnist else "bymerge"
            transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
            train_dataset = datasets.EMNIST("emnist_data", split=split, train=True, download=True, transform=transform)

            test_dataset = datasets.EMNIST("emnist_data", split=split, train=False, transform=transform)

            """
                Table II contains a summary of the EMNIST datasets and
                indicates which classes contain a validation subset in the
                training set. In these datasets, the last portion of the training
                set, equal in size to the testing set, is set aside as a validation
                set. Additionally, this subset is also balanced such that it
                contains an equal number of samples for each task. If the
                validation set is not to be used, then the training set can be
                used as one contiguous set.
            """
            if self == DatasetEnum.emnist:
                # Balanced contains a test set
                split_index = len(train_dataset) - len(test_dataset)
                train_dataset, validation_dataset = subrange_dataset.dataset_subset_split(train_dataset, split_index)
            else:
                validation_dataset = None
            return DataSource(
                train_dataset=train_dataset, test_dataset=test_dataset, validation_dataset=validation_dataset
            )
        else:
            raise NotImplementedError(f"Unknown dataset {self}!")

    @property
    def num_classes(self):
        if self in (DatasetEnum.mnist, DatasetEnum.repeated_mnist_w_noise, DatasetEnum.mnist_w_noise):
            return 10
        elif self in (DatasetEnum.emnist, DatasetEnum.emnist_bymerge):
            return 47
        else:
            raise NotImplementedError(f"Unknown dataset {self}!")

    def create_bayesian_model(self, device):
        num_classes = self.num_classes
        if self in (DatasetEnum.mnist, DatasetEnum.repeated_mnist_w_noise, DatasetEnum.mnist_w_noise):
            return mnist_model.BayesianNet(num_classes=num_classes).to(device)
        elif self in (DatasetEnum.emnist, DatasetEnum.emnist_bymerge):
            return emnist_model.BayesianNet(num_classes=num_classes).to(device)
        else:
            raise NotImplementedError(f"Unknown dataset {self}!")

    def create_optimizer(self, model):
        optimizer = optim.Adam(model.parameters())
        return optimizer

    def create_train_model_extra_args(self, optimizer):
        return {}

    def train_model(
        self,
        train_loader,
        test_loader,
        validation_loader,
        num_inference_samples,
        max_epochs,
        early_stopping_patience,
        desc,
        log_interval,
        device,
        epoch_results_store=None,
    ):
        model = self.create_bayesian_model(device)
        optimizer = self.create_optimizer(model)
        num_epochs, test_metrics = train_model(
            model,
            optimizer,
            max_epochs,
            early_stopping_patience,
            num_inference_samples,
            test_loader,
            train_loader,
            validation_loader,
            log_interval,
            desc,
            device,
            epoch_results_store=epoch_results_store,
            **self.create_train_model_extra_args(optimizer),
        )
        return model, num_epochs, test_metrics


def get_experiment_data(
    data_source,
    num_classes,
    initial_samples,
    reduced_dataset,
    samples_per_class,
    validation_set_size,
    balanced_test_set,
    balanced_validation_set,
):
    train_dataset, test_dataset, validation_dataset = (
        data_source.train_dataset,
        data_source.test_dataset,
        data_source.validation_dataset,
    )

    active_learning_data = ActiveLearningData(train_dataset)
    if initial_samples is None:
        initial_samples = list(
            itertools.chain.from_iterable(
                get_balanced_sample_indices(
                    get_targets(train_dataset), num_classes=num_classes, n_per_digit=samples_per_class
                ).values()
            )
        )

    # Split off the validation dataset after acquiring the initial samples.
    active_learning_data.acquire(initial_samples)

    if validation_dataset is None:
        print("Acquiring validation set from training set.")
        if not validation_set_size:
            validation_set_size = len(test_dataset)

        if not balanced_validation_set:
            validation_dataset = active_learning_data.extract_dataset(validation_set_size)
        else:
            print("Using a balanced validation set")
            validation_dataset = active_learning_data.extract_dataset_from_indices(
                balance_dataset_by_repeating(
                    active_learning_data.available_dataset, num_classes, validation_set_size, upsample=False
                )
            )
    else:
        if validation_set_size == 0:
            print("Using provided validation set.")
            validation_set_size = len(validation_dataset)
        if validation_set_size < len(validation_dataset):
            print("Shrinking provided validation set.")
            if not balanced_validation_set:
                validation_dataset = data.Subset(
                    validation_dataset, torch.randperm(len(validation_dataset))[:validation_set_size].tolist()
                )
            else:
                print("Using a balanced validation set")
                validation_dataset = data.Subset(
                    validation_dataset,
                    balance_dataset_by_repeating(validation_dataset, num_classes, validation_set_size),
                )

    if balanced_test_set:
        print("Using a balanced test set")
        print("Distribution of original test set classes:")
        classes = get_target_bins(test_dataset)
        print(classes)

        test_dataset = data.Subset(
            test_dataset, balance_dataset_by_repeating(test_dataset, num_classes, len(test_dataset))
        )

    if reduced_dataset:
        # Let's assume we won't use more than 1000 elements for our validation set.
        active_learning_data.extract_dataset(len(train_dataset) - max(len(train_dataset) // 20, 5000))
        test_dataset = subrange_dataset.SubrangeDataset(test_dataset, 0, max(len(test_dataset) // 10, 5000))
        if validation_dataset:
            validation_dataset = subrange_dataset.SubrangeDataset(validation_dataset, 0, len(validation_dataset) // 10)
        print("USING REDUCED DATASET!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    show_class_frequencies = True
    if show_class_frequencies:
        print("Distribution of training set classes:")
        classes = get_target_bins(train_dataset)
        print(classes)

        print("Distribution of validation set classes:")
        classes = get_target_bins(validation_dataset)
        print(classes)

        print("Distribution of test set classes:")
        classes = get_target_bins(test_dataset)
        print(classes)

        print("Distribution of pool classes:")
        classes = get_target_bins(active_learning_data.available_dataset)
        print(classes)

        print("Distribution of active set classes:")
        classes = get_target_bins(active_learning_data.active_dataset)
        print(classes)

    print(f"Dataset info:")
    print(f"\t{len(active_learning_data.active_dataset)} active samples")
    print(f"\t{len(active_learning_data.available_dataset)} available samples")
    print(f"\t{len(validation_dataset)} validation samples")
    print(f"\t{len(test_dataset)} test samples")

    if data_source.shared_transform is not None or data_source.train_transform is not None:
        train_dataset = TransformedDataset(
            active_learning_data.active_dataset,
            vision_transformer=compose_transformers([data_source.train_transform, data_source.shared_transform]),
        )
    else:
        train_dataset = active_learning_data.active_dataset

    if data_source.shared_transform is not None or data_source.scoring_transform is not None:
        available_dataset = TransformedDataset(
            active_learning_data.available_dataset,
            vision_transformer=compose_transformers([data_source.scoring_transform, data_source.shared_transform]),
        )
    else:
        available_dataset = active_learning_data.available_dataset

    if data_source.shared_transform is not None:
        test_dataset = TransformedDataset(test_dataset, vision_transformer=data_source.shared_transform)
        validation_dataset = TransformedDataset(validation_dataset, vision_transformer=data_source.shared_transform)

    return ExperimentData(
        active_learning_data=active_learning_data,
        train_dataset=train_dataset,
        available_dataset=available_dataset,
        validation_dataset=validation_dataset,
        test_dataset=test_dataset,
        initial_samples=initial_samples,
    )


def compose_transformers(iterable):
    iterable = list(filter(None, iterable))
    if len(iterable) == 0:
        return None
    if len(iterable) == 1:
        return iterable[0]
    return transforms.Compose(iterable)


# TODO: move to utils?
def get_target_bins(dataset):
    classes = collections.Counter(int(target) for target in get_targets(dataset))
    return classes


# TODO: move to utils?
def balance_dataset_by_repeating(dataset, num_classes, target_size, upsample=True):
    balanced_samples_indices = get_balanced_sample_indices(get_targets(dataset), num_classes, len(dataset)).values()

    if upsample:
        num_samples_per_class = max(
            max(len(samples_per_class) for samples_per_class in balanced_samples_indices), target_size // num_classes
        )
    else:
        num_samples_per_class = min(
            max(len(samples_per_class) for samples_per_class in balanced_samples_indices), target_size // num_classes
        )

    def sample_indices(indices, total_length):
        return (torch.randperm(total_length) % len(indices)).tolist()

    balanced_samples_indices = list(
        itertools.chain.from_iterable(
            [
                [samples_per_class[i] for i in sample_indices(samples_per_class, num_samples_per_class)]
                for samples_per_class in balanced_samples_indices
            ]
        )
    )

    print(f"Resampled dataset ({len(dataset)} samples) to a balanced set of {len(balanced_samples_indices)} samples!")

    return balanced_samples_indices


# TODO: move to utils?
def get_targets(dataset):
    """Get the targets of a dataset without any target target transforms(!)."""
    if isinstance(dataset, TransformedDataset):
        return get_targets(dataset.dataset)
    if isinstance(dataset, data.Subset):
        targets = get_targets(dataset.dataset)
        return torch.as_tensor(targets)[dataset.indices]
    if isinstance(dataset, data.ConcatDataset):
        return torch.cat([get_targets(sub_dataset) for sub_dataset in dataset.datasets])

    if isinstance(dataset, (datasets.MNIST,)):
        return dataset.targets

    raise NotImplementedError(f"Unknown dataset {dataset}!")
