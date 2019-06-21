import matplotlib.pyplot as plt
import al_notebook.results_loader as rl
from typing import Dict
import itertools

COLOR_ORDER = ["C2", "C1", "C3", "C0", "C4", "C5"]


def plot_aggregated_values(
    grouped: Dict[object, rl.AggregateAccuracies],
    key2text=None,
    axes=None,
    show_num_trials=True,
    show_quantiles=True,
    show_thresholds=True,
    markers=None,
    show_samples=False,
    **scatterargs,
):
    if axes is None:
        axes = plt.gca()

    if show_thresholds:
        thresholds = set(itertools.chain.from_iterable([agg.thresholds for agg in grouped.values()]))
        for threshold in thresholds:
            axes.axhline(y=threshold / 100, color="r", linestyle=":")

    if markers is not None:
        markers = list(markers)

    agg: rl.AggregateAccuracies
    for i, (key, agg) in enumerate(grouped.items()):
        label = key2text(key) if key2text is not None else str(key)
        if show_num_trials:
            label += f" ({agg.num_trials} trials)"

        colorargs = dict(color=COLOR_ORDER[i % len(COLOR_ORDER)], linestyle=["-", "--", "-.", ":"][i // 10])

        if show_samples:
            for j, (x, y) in enumerate(zip(agg.sample_points, agg.accuracies)):
                if j == 0:
                    axes.scatter(x, y, label=label, **colorargs, **scatterargs)
                else:
                    axes.scatter(x, y, **colorargs, **scatterargs)
        else:
            mainplot_args = colorargs
            if markers is not None:
                mainplot_args = dict(colorargs)
                mainplot_args["marker"] = markers.pop(0)
                mainplot_args["markersize"] = 5
                mainplot_args["linestyle"] = ""

            axes.plot(agg.quantile_sample_points, agg.quantiles[1], label=label, **mainplot_args)
            axes.plot(agg.quantile_sample_points, agg.quantiles[0], **colorargs, alpha=0.5)
            axes.plot(agg.quantile_sample_points, agg.quantiles[2], **colorargs, alpha=0.5)
            axes.fill_between(agg.quantile_sample_points, agg.quantiles[0], agg.quantiles[2], **colorargs, alpha=0.1)

        print(f"{label}:")
        for threshold, quantiles in zip(agg.thresholds, agg.threshold_quantiles):
            if show_quantiles:
                for v in quantiles:
                    axes.vlines(x=v, ymin=0, ymax=threshold / 100, color=colorargs["color"], linestyle=":", alpha=0.7)

                plt.scatter(quantiles, [threshold / 100] * len(quantiles), **colorargs, alpha=0.7, marker="o")

            print(f"{threshold}% at {quantiles}")


def plot_aggregated_groups_sample_points(
    grouped: Dict[object, rl.AggregateAccuracies],
    key2text=None,
    axes=None,
    show_num_trials=True,
    show_quantiles=True,
    show_thresholds=True,
    **scatterargs,
):
    plot_aggregated_values(
        grouped=grouped,
        key2text=key2text,
        axes=axes,
        show_num_trials=show_num_trials,
        show_quantiles=show_quantiles,
        show_thresholds=show_thresholds,
        show_samples=True,
        **scatterargs,
    )


def plot_aggregated_groups(
    grouped: Dict[object, rl.AggregateAccuracies],
    key2text=None,
    axes=None,
    show_num_trials=True,
    show_quantiles=True,
    show_thresholds=True,
    markers=None,
):
    plot_aggregated_values(
        grouped=grouped,
        key2text=key2text,
        axes=axes,
        show_num_trials=show_num_trials,
        show_quantiles=show_quantiles,
        show_thresholds=show_thresholds,
        show_samples=False,
        markers=markers,
    )


def plot_save(output_path, **kwargs):
    plt.style.use("seaborn-colorblind")
    plt.savefig(output_path, transparent=True, bbox_inches="tight", pad_inches=0, **kwargs)
