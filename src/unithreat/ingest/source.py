"""
unithreat.ingest.source
=======================

Defines the ``FlowSource`` protocol — the single integration contract
that every ingest adapter must satisfy.

Architecture overview
---------------------
UniThreat AI is a **passive** monitoring system.  The detection pipeline
consumes a stream of normalized :class:`~unithreat.ingest.models.Flow`
objects.  It does not care *how* those flows were captured or which wire
format carried them.

The ``FlowSource`` protocol decouples the detection pipeline from any
specific input mechanism.  All adapters — whether JSONL replay, PCAP,
NetFlow, IPFIX, sFlow, or anything else — must produce the same
``Iterable[Flow]`` interface so the pipeline can be wired to any of them
without modification.

                 ┌──────────────────────────────────┐
                 │  Passive traffic / capture files  │
                 └───────┬──────────┬────────────────┘
                         │          │
                    PCAP │    JSONL │  NetFlow / IPFIX / sFlow / …
                    (TBD)│    replay│  (TBD)
                         │          │
                 ┌───────▼──────────▼────────────────┐
                 │           FlowSource               │
                 │    (Iterable[Flow] — any adapter)  │
                 └─────────────────┬─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Detection pipeline │
                          └─────────────────────┘

Implementing a new adapter
--------------------------
An adapter is any callable (function, method, or class with ``__iter__``)
that returns ``Iterable[Flow]``.  It must conform to ``FlowSource``::

    from unithreat.ingest.source import FlowSource
    from unithreat.ingest.models import Flow

    def my_adapter(...) -> Iterable[Flow]:
        # Open read-only source
        # Parse / normalise records
        # Yield Flow objects
        yield flow

The adapter:

* **Must** be strictly read-only with respect to the observed network.
* **Must** yield fully validated :class:`~unithreat.ingest.models.Flow`
  objects (use :func:`~unithreat.ingest.parser.parse_flow` or equivalent
  validation).
* **Must** never load the entire input into memory.
* **Must not** transmit any packets, probes, or control messages.

Notes
-----
``FlowSource`` is a ``runtime_checkable`` ``Protocol`` so that
``isinstance(obj, FlowSource)`` works at runtime where needed (e.g. in
tests or dependency injection containers).
"""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from typing import Protocol, runtime_checkable

from unithreat.ingest.models import Flow


@runtime_checkable
class FlowSource(Protocol):
    """
    Protocol for all passive flow ingest adapters.

    Any object that implements ``__iter__`` and yields :class:`Flow`
    instances satisfies this protocol.

    Concrete adapters live under ``unithreat.ingest.adapters.*``.
    The detection pipeline depends only on this protocol, never on a
    specific adapter.
    """

    def __iter__(self) -> Iterator[Flow]:
        ...


# ---------------------------------------------------------------------------
# Convenience type alias for annotation use
# ---------------------------------------------------------------------------

#: A plain ``Iterable[Flow]`` — the functional form of ``FlowSource``.
#: Use this in function signatures where a generator or list is passed
#: directly rather than a full ``FlowSource`` object.
FlowIterable = Iterable[Flow]
