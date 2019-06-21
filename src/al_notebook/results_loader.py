import blackhc.notebook
import blackhc.laaos

import acquisition_functions
import acquisition_method
import dataset_enum

import pandas as pd
import numpy as np

import collections
import functools
import os
from collections import namedtuple
from typing import NamedTuple
from dataclasses import dataclass
import re
import math


# Fields to ignore by default
culling_fields = [
    "reduce_percentage",
    "initial_percentage",
    "min_remaining_percentage",
    "min_candidates_per_acquired_item",
]


@dataclass
class AggregateAccuracies:
    sample_points: list
    accuracies: list

    quantile_sample_points: list
    quantiles: list

    thresholds: list
    # For each threshold, when it was hit for each trial
    threshold_marks: np.ndarray
    threshold_quantiles: np.ndarray
    num_trials: int


# https://codereview.stackexchange.com/questions/85311/transform-snake-case-to-camelcase
def camel_case_name(snake_case_name):
    return re.sub("_([a-z])", lambda match: match.group(1).upper(), snake_case_name)


__namedtuples = {}


def to_namedtuple(obj, name):
    type_name = "_" + camel_case_name(name)
    if isinstance(obj, dict):
        keys = tuple(obj.keys())
        if keys in __namedtuples:
            nt = __namedtuples[keys]
        else:
            nt = namedtuple(type_name, keys)
            __namedtuples[keys] = nt
        return nt(*(to_namedtuple(v, k) for k, v in obj.items()))
    if isinstance(obj, list):
        item_type_name = type_name + "Item"
        return [to_namedtuple(item, item_type_name) for item in obj]
    if isinstance(obj, set):
        item_type_name = type_name + "Item"
        return {to_namedtuple(item, item_type_name) for item in obj}
    if isinstance(obj, tuple):
        item_type_name = type_name + "Item"
        return tuple(to_namedtuple(item, item_type_name) for item in obj)

    return obj


def get_any(d: dict):
    return next(iter(d.values()))


def handle_map_funcs(func_kv, func_k, func_v, default=None):
    if func_kv:
        assert func_k is None and func_v is None

        def inner(kv):
            return func_kv(*kv)

    elif func_k:
        assert func_v is None

        def inner(kv):
            return func_k(kv[0]), kv[1]

    elif func_v:

        def inner(kv):
            return kv[0], func_v(kv[1])

    else:
        return default
    return inner


def handle_unary_funcs(pred_kv, pred_k, pred_v, default=None):
    if pred_kv:
        assert pred_k is None and pred_v is None

        def inner(kv):
            return pred_kv(*kv)

    elif pred_k:
        assert pred_v is None

        def inner(kv):
            return pred_k(kv[0])

    elif pred_v:

        def inner(kv):
            return pred_v(kv[1])

    else:
        return default
    return inner


def map_dict(d: dict, *, kv=None, k=None, v=None):
    inner = handle_map_funcs(kv, k, v)
    return dict(map(inner, d.items()))


def filter_dict(d: dict, *, kv=None, k=None, v=None):
    inner_pred = handle_unary_funcs(kv, k, v)
    return dict(filter(inner_pred, d.items()))


def sort_dict(d: dict, *, reverse=False, kv=None, k=None, v=None):
    inner_key = handle_unary_funcs(kv, k, v, default=lambda ikv: ikv[0])
    return dict(sorted(d.items(), key=inner_key, reverse=reverse))


def groupby_dict(d: dict, *, key_kv=None, key_k=None, key_v=None, agg=None):
    inner_key = handle_unary_funcs(key_kv, key_k, key_v)

    grouped_by = {}
    for kv in d.items():
        new_key = inner_key(kv)
        if new_key not in grouped_by:
            grouped_by[new_key] = {}
        key, value = kv
        grouped_by[new_key][key] = value

    if agg is not None:
        return map_dict(grouped_by, v=agg)

    return grouped_by


# Because Python sucks.
def parse_enum_str(enum_str: str, enum_cls):
    value = enum_str.split(".", 1)[1]
    return enum_cls[value]


def recover_args(laaos_store) -> tuple:
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

    return args


def get_laaos_files(laaos_dir=None):
    if laaos_dir is None:
        laaos_dir = "./laaos/"

    laaos_files = {}
    for root, dirs, files in os.walk(laaos_dir, topdown=False):
        for name in files:
            if not name.endswith(".py"):
                continue

            rel_path = os.path.join(root, name)
            result_name = rel_path[len(laaos_dir) :]
            abs_path = os.path.abspath(rel_path)
            laaos_files[result_name] = abs_path

    return laaos_files


def load_laaos_files(path=None, files=None, vanilla=False, tag=None, prefix=None):
    if files is None:
        files = get_laaos_files(path)

    stores = {}
    for name, path in files.items():

        def nan():
            pass

        store = blackhc.laaos.safe_load(path, expose_symbols=[nan])
        store["actual_name"] = name
        store["actual_path"] = path
        store["tag"] = tag
        store["args"] = recover_args(store)

        key = f"{prefix}{name}" if prefix is not None else name
        stores[key] = store

    if vanilla:
        return stores
    else:
        return map_dict(stores, v=functools.partial(to_namedtuple, name="Result"))


def gather_accuracy(store):
    """Gathers all accuracy values from the iterations in a store.

    :returns an array of accuracies.
    """
    accuracy = []
    for iteration in store.iterations:
        accuracy.append(iteration.test_metrics.accuracy)

    return accuracy


def fix_chosen_samples(chosen_samples):
    return chosen_samples if isinstance(chosen_samples, list) else [chosen_samples]


def gather_samples_I(store):
    """Gathers all samples in a store.

        :returns a list of list of samples.
        """
    samples_I = [store.initial_samples] + [
        fix_chosen_samples(iteration.chosen_samples) for iteration in store.iterations
    ]
    return samples_I


def pandas_accuracies(stores: dict):
    """Creates a pandas DataFrame from the accuracies in a dict of stores."""
    return pd.DataFrame.from_dict(map_dict(stores, v=lambda store: pd.Series(gather_accuracy(store))), orient="index")


def index_of_first(iter, pred):
    """Gets the index of the first element in `iter` that satifies `pred`."""
    try:
        return next(i for i, v in enumerate(iter) if pred(v))
    except StopIteration:
        return None


def get_marks(values_S, threshold):
    marks = []
    for accuracies in values_S:
        index = index_of_first(accuracies, lambda v: v >= threshold)
        marks.append(index - 1 if index else math.inf)
    return np.asarray(marks)


def get_accuracy(iteration):
    return iteration.test_metrics.accuracy


def get_samples_accuracy_I(store):
    """Get all samples and accuracies for iterations (I) in a store.

    We never evaluate the final batch of chosen samples. Accuracies are always for the previous batch of
    acquisition samples.

    :returns a list of (samples, accuracy) tuples. accuracy refers to the accuracy after having added samples to the
    training set.
    """
    return get_samples_values_I(store, gather_accuracy)


def get_samples_values_I(store, values_getter):
    """
    :returns a list of (samples, values) tuples. accuracy refers to the accuracy after having added samples to the
    training set.
    """

    values_I = list(values_getter(store))
    samples_I = gather_samples_I(store)

    samples_values_I = list(zip(samples_I, values_I))
    return samples_values_I


def expand_samples_I_values_I(samples_values_I):
    """Subsample a list of accuracies as if an accuracy were acquired after each sample.

    Provides optimistic subsamples. (The finaly accuracy is attributed starting from the first sample that was added.

    :returns a list of accuracies and a list of the original samples.
    """
    accuracies = []
    sample_points = []
    current = 0
    accuracies.append(0)
    sample_points.append(0)
    for samples, accuracy in samples_values_I:
        num_samples = len(samples)
        if num_samples > 0:
            accuracies.extend([accuracy] * num_samples)
            current += num_samples
            sample_points.append(current)
        else:
            accuracies[-1] = accuracy

    return accuracies, sample_points


def fill_values_sample_points_T(values_sample_points_T):
    """Ensures that each list of accuracies in accuracies_T has the same length.

    :param values_sample_points_T: tuple of list of accuracies and sample_points.
    :return: tuple of list of filled accuracies and of sample points
    """
    accuracies_T, sample_points_T = zip(*values_sample_points_T)

    max_length = max(len(result) for result in accuracies_T)

    filled_by_repeat = [result + [result[-1]] * (max_length - len(result)) for result in accuracies_T]

    return filled_by_repeat, sample_points_T


def merge_sample_points_T(sample_points_T):
    """Merge sample_points_T into just one list.

    :returns a list of sample_points.
    """
    return list(sorted({sample_point for sample_points in sample_points_T for sample_point in sample_points}))


def aggregate_values_sample_points_T(values_sample_points_T, percentiles=None, thresholds=None):
    values_T, sample_points_T = fill_values_sample_points_T(values_sample_points_T)

    result_array = np.asarray(values_T)

    if percentiles is None:
        percentiles = (25, 50, 75)
    if thresholds is None:
        thresholds = (90, 95)

    result_quantiles = np.percentile(result_array, percentiles, axis=0)

    if thresholds:
        threshold_marks = np.asarray([get_marks(result_array, threshold / 100) for threshold in thresholds])
        threshold_quantiles = np.percentile(threshold_marks, percentiles, interpolation="nearest", axis=1).T
    else:
        threshold_marks = np.empty((0, 0))
        threshold_quantiles = np.empty((0, 0))

    values = [row[sample_points] for row, sample_points in zip(result_array, sample_points_T)]

    quantile_sample_points = merge_sample_points_T(sample_points_T)
    quantiles = result_quantiles[:, quantile_sample_points]

    return AggregateAccuracies(
        sample_points_T,
        values,
        quantile_sample_points,
        quantiles,
        thresholds,
        threshold_marks,
        threshold_quantiles,
        num_trials=len(result_array),
    )


def aggregate_accuracies(stores, percentiles=None, thresholds=None):
    return aggregate_values(stores, gather_accuracy, percentiles, thresholds)


def aggregate_values(stores, values_getter, percentiles=None, thresholds=None):
    values_sample_points_T = [
        expand_samples_I_values_I(get_samples_values_I(store, values_getter)) for store in stores.values()
    ]
    return aggregate_values_sample_points_T(values_sample_points_T, percentiles=percentiles, thresholds=thresholds)


def gather_accuracies(stores):
    return gather_values(stores, gather_accuracy)


def gather_values(stores, values_getter):
    values_sample_points_T = [
        expand_samples_I_values_I(get_samples_values_I(store, values_getter)) for store in stores.values()
    ]

    values_T, sample_points_T = fill_values_sample_points_T(values_sample_points_T)
    result_array = np.asarray(values_T)

    sample_points = merge_sample_points_T(sample_points_T)
    return sample_points, dict(zip(stores.keys(), result_array[:, sample_points]))


def get_threshold_quantiles_key(agg):
    # First comes median, then 25% quantile, starting with the higher thresholds
    if agg.threshold_quantiles is None or len(agg.threshold_quantiles) == 0:
        return ()
    return tuple(reversed(agg.threshold_quantiles[:, 1])), tuple(reversed(agg.threshold_quantiles[:, 0]))


def merge_args(stores):
    field_sets = collections.defaultdict(set)

    first_store = True
    for store in stores.values():
        for field, value in store.args._asdict().items():
            if isinstance(value, list):
                value = tuple(value)
            field_sets[field].add(value)

        field_sets["num_acquired_points"].add(
            len(store.initial_samples) + len(store.iterations) * store.args.available_sample_k
        )
        field_sets["num_initial_samples"].add(len(store.initial_samples))
        field_sets["tag"].add(store.tag)

        for field in (
            set(field_sets.keys())
            - set(store.args._asdict().keys())
            - {"num_acquired_points", "num_initial_samples", "tag"}
        ):
            field_sets[field].add(None)

    return field_sets


def get_merge_args_field(store, field_name):
    if field_name == "num_acquired_points":
        return len(store.initial_samples) + len(store.iterations) * store.args.available_sample_k
    elif field_name == "num_initial_samples":
        return len(store.initial_samples)
    elif field_name == "tag":
        return store.tag
    else:
        return store.args._asdict().get(field_name, None)


def discard_eng_args(args_dict):
    return {
        field: values
        for field, values in args_dict.items()
        if field
        not in (
            "name",
            "seed",
            "experiment_task_id",
            "log_interval",
            "target_num_acquired_samples",
            "batch_size",
            "epochs",
            "epoch_samples",
            "no_cuda",
            "target_accuracy",
            "scoring_batch_size",
            "test_batch_size",
            "early_stopping_patience",
            "validation_set_size",
        )
    }


def diff_args(stores):
    merged_values = discard_eng_args(merge_args(stores))

    diff_fields = {field: values for field, values in merged_values.items() if len(values) > 1}

    return diff_fields


def get_stores_info(stores, include_keys=False):
    info = dict(num_trials=len(stores))
    if include_keys:
        info["keys"] = list(stores.keys())
    info.update(discard_eng_args(merge_args(stores)))
    return info


class VIPArgs(NamedTuple):
    af: acquisition_functions.AcquisitionFunction
    am: acquisition_method.AcquisitionMethod
    b: int
    k: int
    ds: int
    nis: int
    nap: int
    tag: str


def get_vip_args(store):
    af = store.args.type
    am = store.args.acquisition_method
    b = store.args.available_sample_k
    k = store.args.num_inference_samples
    ds = store.args.dataset
    nis = len(store.initial_samples)
    nap = nis + b * len(store.iterations)
    tag = store.tag
    return VIPArgs(af, am, b, k, ds, nis, nap, tag)


def load_experiment_results(*experiments, incl_current=False, incl_current_vm=False):
    experiments = experiments or []

    stores = {}

    for result_dir in experiments:
        stores.update(load_laaos_files(f"./laaos_results/{result_dir}/", tag=result_dir, prefix=result_dir + "/"))

    if incl_current:
        stores.update(load_laaos_files("./laaos/", tag="current/"))
    if incl_current_vm:
        stores.update(load_laaos_files("./vm_laaos/all", tag="current_vm/"))

    return stores


def get_diff_args_key2text(stores, ignore_fields=()):
    def map_field_name(field_name):
        mfn = dict(
            type="af",
            acquisition_method="am",
            num_inference_samples="k",
            available_sample_k="b",
            dataset="ds",
            num_initial_samples="nis",
            num_acquired_points="nap",
        )
        return mfn.get(field_name, field_name)

    def map_field_value(field_name, value):
        if field_name in ("dataset", "acquisition_method", "type"):
            return value.name
        else:
            return value

    diffed_args = diff_args(stores)
    fields = set(diffed_args.keys())

    ignore_fields = set(ignore_fields)
    fields -= ignore_fields

    sorted_fields = []
    prefixes = []
    if "acquisition_method" in fields:
        sorted_fields.append("acquisition_method")
        prefixes.append("")
    if "type" in fields:
        sorted_fields.append("type")
        prefixes.append("")
    if "available_sample_k" in fields:
        sorted_fields.append("available_sample_k")
        prefixes.append("b")
    if "num_inference_samples" in fields:
        sorted_fields.append("num_inference_samples")
        prefixes.append("k")
    if "dataset" in fields:
        sorted_fields.append("dataset")
        prefixes.append("")
    for field in fields:
        if field not in sorted_fields and field not in (
            "initial_samples",
            "experiment_description",
            "experiments_laaos",
            "num_acquired_points",
        ):
            sorted_fields.append(field)
            prefixes.append(f"{map_field_name(field)}=")

    def key2text(name, store):
        return " ".join(
            f"{prefix}{map_field_value(field_name, get_merge_args_field(store, field_name))}"
            for prefix, field_name in zip(prefixes, sorted_fields)
        )

    return key2text
