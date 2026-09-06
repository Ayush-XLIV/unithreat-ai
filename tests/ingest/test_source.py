"""
tests/ingest/test_source.py
============================

Tests for unithreat.ingest.source — the FlowSource protocol.

Covers:
- FlowSource is runtime-checkable
- Any Iterable[Flow]-producing class satisfies FlowSource
- A class that does not implement __iter__ does not satisfy FlowSource
- FlowIterable is exported
- The deprecated replay shim emits DeprecationWarning
"""

from __future__ import annotations

import io
import json
import warnings
from collections.abc import Iterator

import pytest

from unithreat.ingest.models import Flow
from unithreat.ingest.source import FlowIterable, FlowSource


# ---------------------------------------------------------------------------
# Minimal conforming adapter (standalone — no JSONL dependency)
# ---------------------------------------------------------------------------


class _StaticAdapter:
    """Trivial adapter that yields a fixed list of flows."""

    def __init__(self, flows: list[Flow]) -> None:
        self._flows = flows

    def __iter__(self) -> Iterator[Flow]:
        yield from self._flows


class _NotAnAdapter:
    """Does not implement __iter__."""
    pass


def _make_flow(n: int = 1) -> Flow:
    return Flow.model_validate({
        "flow_id": f"flow-{n:03d}",
        "timestamp": "2026-09-05T10:00:00Z",
        "src_ip": "10.0.0.1",
        "dst_ip": "10.0.0.2",
        "protocol": "TCP",
    })


# ---------------------------------------------------------------------------
# Protocol conformance
# ---------------------------------------------------------------------------


class TestFlowSourceProtocol:
    def test_static_adapter_satisfies_flow_source(self):
        adapter = _StaticAdapter([_make_flow(1)])
        assert isinstance(adapter, FlowSource)

    def test_non_adapter_does_not_satisfy_flow_source(self):
        obj = _NotAnAdapter()
        assert not isinstance(obj, FlowSource)

    def test_generator_function_result_satisfies_flow_source(self):
        """A plain generator object satisfies FlowSource."""
        def _gen():
            yield _make_flow(1)

        gen = _gen()
        assert isinstance(gen, FlowSource)

    def test_list_of_flows_satisfies_flow_source(self):
        """A list is Iterable so it satisfies the protocol."""
        flows: list[Flow] = [_make_flow(1), _make_flow(2)]
        assert isinstance(flows, FlowSource)

    def test_adapter_yields_correct_flows(self):
        expected = [_make_flow(1), _make_flow(2)]
        adapter = _StaticAdapter(expected)
        result = list(adapter)
        assert result == expected

    def test_flow_iterable_alias_exported(self):
        assert FlowIterable is not None


# ---------------------------------------------------------------------------
# Deprecation shim test
# ---------------------------------------------------------------------------


class TestReplayShim:
    def test_import_from_replay_emits_deprecation_warning(self):
        """
        Importing from the old unithreat.ingest.replay path must emit a
        DeprecationWarning pointing to the new adapters.jsonl location.
        """
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            # Force a fresh import evaluation by accessing the module
            import importlib
            import unithreat.ingest.replay as shim
            importlib.reload(shim)

        deprecation_warnings = [
            w for w in caught if issubclass(w.category, DeprecationWarning)
        ]
        assert deprecation_warnings, "Expected a DeprecationWarning from replay shim"
        messages = [str(w.message) for w in deprecation_warnings]
        assert any("adapters.jsonl" in m for m in messages)

    def test_replay_shim_still_exports_replay_jsonl(self):
        """The shim must re-export replay_jsonl for backward compatibility."""
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            from unithreat.ingest.replay import replay_jsonl
            from unithreat.ingest.adapters.jsonl import replay_jsonl as canonical

        assert replay_jsonl is canonical
