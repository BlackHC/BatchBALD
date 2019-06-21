import torch.utils.data as data
import ignite
from blackhc.progress_bar import create_progress_bar


class IgniteProgressBar(object):
    def __init__(self, desc, log_interval):
        self.log_interval = log_interval
        self.desc = desc
        self.progress_bar = None

    def attach(self, engine: ignite.engine.Engine):
        engine.add_event_handler(ignite.engine.Events.EPOCH_STARTED, self.on_start)
        engine.add_event_handler(ignite.engine.Events.EPOCH_COMPLETED, self.on_complete)
        engine.add_event_handler(ignite.engine.Events.ITERATION_COMPLETED, self.on_iteration_complete)

    def on_start(self, engine):
        dataloader = engine.state.dataloader
        self.progress_bar = create_progress_bar(len(dataloader) * dataloader.batch_size)

        print(self.desc(engine))
        self.progress_bar.start()

    def on_complete(self, engine):
        self.progress_bar.finish()

    def on_iteration_complete(self, engine):
        dataloader = engine.state.dataloader
        iter = (engine.state.iteration - 1) % len(dataloader) + 1

        if iter % self.log_interval == 0:
            self.progress_bar.update(self.log_interval * dataloader.batch_size)


def ignite_progress_bar(engine: ignite.engine.Engine, desc=None, log_interval=0):
    wrapper = IgniteProgressBar(desc, log_interval)
    wrapper.attach(engine)

    return wrapper
