"""
tests/ingest/test_replay.py
===========================

Unit tests for the JSONL replay adapter.

Import path: ``unithreat.ingest.adapters.jsonl``

The JSONL adapter is a development / demonstration tool.
It is one of several planned adapters; all adapters satisfy
``unithreat.ingest.source.FlowSource``.

Covers:
- replay_jsonl generator form
- JsonlAdapter class form (FlowSource protocol conformance)
- Blank line skipping
- Memory: return type is a Generator, not a list
- File-like object (StringIO) accepted
- Path / str path accepted
- Malformed JSON raises json.JSONDecodeError by default
- Malformed record raises FlowParseError by default
- skip_malformed=True emits warning and continues
- Flow ordering preserved
- Non-existent path raises FileNotFoundError
- speed_factor=0.0 produces all flows without delay
- speed_factor>0 still produces correct flows (timing not exercised)
"""

from __future__ import annotations

import io
import json
import warnings
from collections.abc import Generator
from pathlib import Path

import pytest

from unithreat.ingest.models import Flow
from unithreat.ingest.parser import FlowParseError
from unithreat.ingest.adapters.jsonl import JsonlAdapter, replay_jsonl
from unithreat.ingest.source import FlowSource

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _flow_line(**overrides) -> str:
    base = {
        "flow_id": "flow-001",
        "timestamp": "2026-09-05T10:00:00Z",
        "src_ip": "192.168.1.10",
        "dst_ip": "10.0.0.1",
        "protocol": "TCP",
    }
    base.update(overrides)
    return json.dumps(base)


def _make_jsonl(*records: dict) -> str:
    return "\n".join(json.dumps(r) for r in records)


VALID_RECORD = {
    "flow_id": "flow-001",
    "timestamp": "2026-09-05T10:00:00Z",
    "src_ip": "192.168.1.10",
    "dst_ip": "10.0.0.1",
    "protocol": "TCP",
}

VALID_RECORD_2 = {
    "flow_id": "flow-002",
    "timestamp": "2026-09-05T10:00:01Z",
    "src_ip": "192.168.1.11",
    "dst_ip": "10.0.0.2",
    "protocol": "UDP",
}


# ---------------------------------------------------------------------------
# Protocol conformance
# ---------------------------------------------------------------------------


class TestFlowSourceProtocol:
    def test_jsonl_adapter_satisfies_flow_source(self):
        """JsonlAdapter must satisfy the FlowSource protocol."""
        adapter = JsonlAdapter(io.StringIO(_flow_line()))
        assert isinstance(adapter, FlowSource)

    def test_jsonl_adapter_yields_flows(self):
        adapter = JsonlAdapter(io.StringIO(_flow_line()))
        flows = list(adapter)
        assert len(flows) == 1
        assert isinstance(flows[0], Flow)

    def test_jsonl_adapter_repr(self):
        adapter = JsonlAdapter("data/sample.jsonl", speed_factor=1.0)
        assert "JsonlAdapter" in repr(adapter)
        assert "data/sample.jsonl" in repr(adapter)


# ---------------------------------------------------------------------------
# Basic streaming — functional form
# ---------------------------------------------------------------------------


class TestReplayJsonlBasic:
    def test_returns_generator(self):
        fh = io.StringIO(_flow_line())
        gen = replay_jsonl(fh)
        assert isinstance(gen, Generator)

    def test_single_valid_record_yields_one_flow(self):
        fh = io.StringIO(_flow_line())
        flows = list(replay_jsonl(fh))
        assert len(flows) == 1
        assert isinstance(flows[0], Flow)

    def test_multiple_valid_records_yields_all(self):
        content = _make_jsonl(VALID_RECORD, VALID_RECORD_2)
        fh = io.StringIO(content)
        flows = list(replay_jsonl(fh))
        assert len(flows) == 2
        assert flows[0].flow_id == "flow-001"
        assert flows[1].flow_id == "flow-002"

    def test_ordering_preserved(self):
        records = [
            {**VALID_RECORD, "flow_id": f"flow-{i:03d}",
             "timestamp": f"2026-09-05T10:00:{i:02d}Z"}
            for i in range(10)
        ]
        fh = io.StringIO(_make_jsonl(*records))
        flow_ids = [f.flow_id for f in replay_jsonl(fh)]
        assert flow_ids == [f"flow-{i:03d}" for i in range(10)]

    def test_blank_lines_skipped(self):
        content = "\n".join([
            _flow_line(flow_id="flow-001"),
            "",
            "   ",
            _flow_line(flow_id="flow-002"),
        ])
        fh = io.StringIO(content)
        flows = list(replay_jsonl(fh))
        assert len(flows) == 2

    def test_empty_file_yields_nothing(self):
        fh = io.StringIO("")
        flows = list(replay_jsonl(fh))
        assert flows == []

    def test_only_blank_lines_yields_nothing(self):
        fh = io.StringIO("\n\n\n")
        flows = list(replay_jsonl(fh))
        assert flows == []


# ---------------------------------------------------------------------------
# File path tests
# ---------------------------------------------------------------------------


class TestReplayJsonlFilePath:
    def test_path_object_accepted(self, tmp_path):
        p = tmp_path / "flows.jsonl"
        p.write_text(_flow_line() + "\n", encoding="utf-8")
        flows = list(replay_jsonl(p))
        assert len(flows) == 1

    def test_string_path_accepted(self, tmp_path):
        p = tmp_path / "flows.jsonl"
        p.write_text(_flow_line() + "\n", encoding="utf-8")
        flows = list(replay_jsonl(str(p)))
        assert len(flows) == 1

    def test_nonexistent_path_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            list(replay_jsonl(tmp_path / "no_such_file.jsonl"))


# ---------------------------------------------------------------------------
# Error handling — strict mode (default)
# ---------------------------------------------------------------------------


class TestReplayJsonlErrorsStrict:
    def test_malformed_json_raises(self):
        fh = io.StringIO("not valid json\n")
        with pytest.raises(json.JSONDecodeError):
            list(replay_jsonl(fh))

    def test_missing_required_field_raises_flow_parse_error(self):
        bad = {"timestamp": "2026-09-05T10:00:00Z", "src_ip": "1.2.3.4"}
        fh = io.StringIO(json.dumps(bad))
        with pytest.raises(FlowParseError):
            list(replay_jsonl(fh))

    def test_invalid_port_raises_flow_parse_error(self):
        fh = io.StringIO(_flow_line(src_port=99999))
        with pytest.raises(FlowParseError):
            list(replay_jsonl(fh))

    def test_error_stops_iteration(self):
        content = "\n".join([
            _flow_line(flow_id="flow-001"),
            "BAD JSON",
            _flow_line(flow_id="flow-003"),
        ])
        fh = io.StringIO(content)
        with pytest.raises(json.JSONDecodeError):
            list(replay_jsonl(fh))


# ---------------------------------------------------------------------------
# Error handling — skip_malformed mode
# ---------------------------------------------------------------------------


class TestReplayJsonlSkipMalformed:
    def test_bad_json_skipped_with_warning(self):
        content = "\n".join([
            _flow_line(flow_id="flow-001"),
            "INVALID JSON",
            _flow_line(flow_id="flow-003"),
        ])
        fh = io.StringIO(content)
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            flows = list(replay_jsonl(fh, skip_malformed=True))
        assert len(flows) == 2
        assert any("JSON" in str(warning.message) for warning in w)

    def test_invalid_record_skipped_with_warning(self):
        bad = {"timestamp": "2026-09-05T10:00:00Z"}
        content = "\n".join([
            _flow_line(flow_id="flow-001"),
            json.dumps(bad),
            _flow_line(flow_id="flow-003"),
        ])
        fh = io.StringIO(content)
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            flows = list(replay_jsonl(fh, skip_malformed=True))
        assert len(flows) == 2
        assert any(w)

    def test_all_bad_records_skipped_yields_empty(self):
        content = "BAD\nALSO BAD\n"
        fh = io.StringIO(content)
        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            flows = list(replay_jsonl(fh, skip_malformed=True))
        assert flows == []


# ---------------------------------------------------------------------------
# speed_factor (no real delay exercised in CI)
# ---------------------------------------------------------------------------


class TestReplayJsonlSpeedFactor:
    def test_speed_factor_zero_yields_all_flows(self):
        content = _make_jsonl(VALID_RECORD, VALID_RECORD_2)
        fh = io.StringIO(content)
        flows = list(replay_jsonl(fh, speed_factor=0.0))
        assert len(flows) == 2

    def test_speed_factor_nonzero_still_yields_correct_flows(self):
        records = [
            {**VALID_RECORD, "flow_id": f"flow-{i:03d}",
             "timestamp": f"2026-09-05T10:00:0{i}Z"}
            for i in range(3)
        ]
        fh = io.StringIO(_make_jsonl(*records))
        flows = list(replay_jsonl(fh, speed_factor=1_000_000.0))
        assert len(flows) == 3
