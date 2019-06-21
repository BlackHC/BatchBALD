# Inspired by https://stackoverflow.com/a/30024601/854731
from contextlib import AbstractContextManager
from timeit import default_timer


class ContextStopwatch(AbstractContextManager):
    def __init__(self):
        self.start_time = None
        self.end_time = None

    @property
    def elapsed_time(self):
        return self.end_time - self.start_time

    def __enter__(self):
        self.start_time = default_timer()
        return super().__enter__()

    def __exit__(self, exc_type, exc_value, traceback):
        self.end_time = default_timer()
