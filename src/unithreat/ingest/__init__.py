"""
unithreat.ingest
================

Public surface of the ingest layer.

Stable exports
--------------
``Flow``
    The normalized passive flow event model.  Governed by
    ``contracts/flow-schema.json``.  All adapters produce this type.

``FlowParseError``
    Raised when a raw record cannot be converted into a valid ``Flow``.

``parse_flow``
    Validate and convert a single raw dict into a ``Flow``.  Used by
    adapters; also useful in tests and one-off scripts.

``FlowSource``
    Protocol that all ingest adapters must satisfy.  The detection
    pipeline depends only on this protocol, never on a specific adapter.

``FlowIterable``
    Type alias for ``Iterable[Flow]`` — the functional form of
    ``FlowSource``.

Adapters
--------
Adapters are **not** re-exported from this package.  Import them
explicitly from their own modules::

    # Development / demo replay only:
    from unithreat.ingest.adapters.jsonl import replay_jsonl, JsonlAdapter

    # Future production adapters (not yet implemented):
    # from unithreat.ingest.adapters.pcap    import PcapAdapter
    # from unithreat.ingest.adapters.netflow import NetFlowAdapter
    # from unithreat.ingest.adapters.ipfix   import IpfixAdapter
    # from unithreat.ingest.adapters.sflow   import SFlowAdapter

This separation ensures that importing the ingest package does not pull
in optional heavy dependencies (e.g. libpcap bindings) that belong only
to specific adapters.
"""

from unithreat.ingest.models import Flow
from unithreat.ingest.parser import FlowParseError, parse_flow
from unithreat.ingest.source import FlowIterable, FlowSource

__all__ = [
    "Flow",
    "FlowParseError",
    "FlowIterable",
    "FlowSource",
    "parse_flow",
]
