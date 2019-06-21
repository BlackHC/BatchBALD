import ignite
from torch import optim as optim
from torch.nn import functional as F
from torch import nn

import ignite_restoring_score_guard
from ignite_progress_bar import ignite_progress_bar
from ignite_utils import epoch_chain, chain, log_epoch_results, store_epoch_results, store_iteration_results
from sampler_model import SamplerModel, NoDropoutModel
from typing import NamedTuple


class TrainModelResult(NamedTuple):
    num_epochs: int
    test_metrics: dict


def build_metrics():
    return {"accuracy": ignite.metrics.Accuracy(), "nll": ignite.metrics.Loss(F.nll_loss)}


def train_model(
    model: nn.Module,
    optimizer: optim.Optimizer,
    max_epochs,
    early_stopping_patience,
    num_inference_samples,
    test_loader,
    train_loader,
    validation_loader,
    log_interval,
    desc,
    device,
    lr_scheduler: optim.lr_scheduler._LRScheduler = None,
    num_lr_epochs=0,
    epoch_results_store=None,
) -> TrainModelResult:
    test_sampler = SamplerModel(model, k=min(num_inference_samples, 100)).to(device)
    validation_sampler = NoDropoutModel(model).to(device)
    training_sampler = SamplerModel(model, k=1).to(device)

    trainer = ignite.engine.create_supervised_trainer(training_sampler, optimizer, F.nll_loss, device=device)
    validation_evaluator = ignite.engine.create_supervised_evaluator(
        validation_sampler, metrics=build_metrics(), device=device
    )

    def out_of_patience():
        nonlocal num_lr_epochs
        if num_lr_epochs <= 0 or lr_scheduler is None:
            trainer.terminate()
        else:
            lr_scheduler.step()
            restoring_score_guard.patience = int(restoring_score_guard.patience * 1.5 + 0.5)
            print(f"New LRs: {[group['lr'] for group in optimizer.param_groups]}")
            num_lr_epochs -= 1

    if lr_scheduler is not None:
        print(f"LRs: {[group['lr'] for group in optimizer.param_groups]}")

    restoring_score_guard = ignite_restoring_score_guard.RestoringScoreGuard(
        patience=early_stopping_patience,
        score_function=lambda engine: engine.state.metrics["accuracy"],
        out_of_patience_callback=out_of_patience,
        module=model,
        optimizer=optimizer,
        training_engine=trainer,
        validation_engine=validation_evaluator,
    )

    if test_loader is not None:
        test_evaluator = ignite.engine.create_supervised_evaluator(test_sampler, metrics=build_metrics(), device=device)
        ignite_progress_bar(test_evaluator, desc("Test Eval"), log_interval)
        chain(trainer, test_evaluator, test_loader)
        log_epoch_results(test_evaluator, "Test", trainer)

    ignite_progress_bar(trainer, desc("Training"), log_interval)
    ignite_progress_bar(validation_evaluator, desc("Validation Eval"), log_interval)

    # NOTE(blackhc): don't run a full test eval after every epoch.
    # epoch_chain(trainer, test_evaluator, test_loader)

    epoch_chain(trainer, validation_evaluator, validation_loader)

    log_epoch_results(validation_evaluator, "Validation", trainer)

    if epoch_results_store is not None:
        epoch_results_store["validations"] = []
        epoch_results_store["losses"] = []
        store_epoch_results(validation_evaluator, epoch_results_store["validations"])
        store_iteration_results(trainer, epoch_results_store["losses"], log_interval=2)

        if test_loader is not None:
            store_epoch_results(test_evaluator, epoch_results_store, name="test")

    if len(train_loader.dataset) > 0:
        trainer.run(train_loader, max_epochs)
    else:
        test_evaluator.run(test_loader)

    num_epochs = trainer.state.epoch if trainer.state else 0

    test_metrics = None
    if test_loader is not None:
        test_metrics = test_evaluator.state.metrics

    return TrainModelResult(num_epochs, test_metrics)
