"""Shared elapsed-time budget for initial generation and JSON repair."""
import time
from contextvars import ContextVar
from contextlib import contextmanager

deadline = ContextVar('itinerary_deadline', default=None)


@contextmanager
def generation_budget(seconds=60):
    token = deadline.set(time.monotonic() + seconds)
    try:
        yield
    finally:
        deadline.reset(token)


def remaining():
    end = deadline.get()
    return max(0, end - time.monotonic()) if end is not None else 60
