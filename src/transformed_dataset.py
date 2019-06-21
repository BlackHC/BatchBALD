from torch.utils import data as data


class TransformedDataset(data.Dataset):
    """
    Transforms a dataset.

    Arguments:
        dataset (Dataset): The whole Dataset
        transformer (LambdaType): (idx, sample) -> transformed_sample
    """

    def __init__(self, dataset, *, transformer=None, vision_transformer=None):
        self.dataset = dataset
        assert not transformer or not vision_transformer
        if transformer:
            self.transformer = transformer
        else:
            self.transformer = lambda _, data_label: (vision_transformer(data_label[0]), data_label[1])

    def __getitem__(self, idx):
        return self.transformer(idx, self.dataset[idx])

    def __len__(self):
        return len(self.dataset)
