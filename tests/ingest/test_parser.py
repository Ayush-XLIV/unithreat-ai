"""
tests/ingest/test_parser.py
===========================

Unit tests for unithreat.ingest.parser.

Covers:
- Valid minimal record accepted
- Valid full record accepted
- Non-dict input rejected with FlowParseError
- Missing required field rejected
- Port out-of-range rejected
- Invalid direction enum rejected
- Negative numeric fields rejected
- Protocol-metadata sub-objects passed through
- Error message quality (path + reason exposed)
"""

from __future__ import annotations

import pytest

from unithreat.ingest.models import Flow
from unithreat.ingest.parser import FlowParseError, parse_flow

# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

MINIMAL = {
    "flow_id": "flow-001",
    "timestamp": "2026-09-05T10:00:00Z",
    "src_ip": "192.168.1.10",
    "dst_ip": "10.0.0.1",
    "protocol": "TCP",
}


def minimal(**overrides):
    return {**MINIMAL, **overrides}


# ---------------------------------------------------------------------------
# Happy-path tests
# ---------------------------------------------------------------------------


class TestParseFlowValid:
    def test_minimal_record_returns_flow(self):
        flow = parse_flow(MINIMAL)
        assert isinstance(flow, Flow)
        assert flow.flow_id == "flow-001"
        assert flow.protocol == "TCP"

    def test_full_record_accepted(self):
        record = minimal(
            src_port=54321,
            dst_port=443,
            direction="outbound",
            duration=2.5,
            packet_count=20,
            byte_count=2048,
            tcp_flags="SYN-ACK",
            dns={"query": "example.com", "qtype": "A"},
            tls={"version": "TLS 1.3", "ja3": "abc123"},
            quic={"version": "1"},
        )
        flow = parse_flow(record)
        assert flow.dst_port == 443
        assert flow.direction == "outbound"
        assert flow.tls == {"version": "TLS 1.3", "ja3": "abc123"}

    def test_null_optional_fields_accepted(self):
        record = minimal(
            src_port=None,
            dst_port=None,
            direction=None,
            dns=None,
        )
        flow = parse_flow(record)
        assert flow.src_port is None
        assert flow.dns is None

    @pytest.mark.parametrize("direction", ["inbound", "outbound", "internal", "unknown"])
    def test_all_valid_directions_accepted(self, direction):
        flow = parse_flow(minimal(direction=direction))
        assert flow.direction == direction

    def test_protocol_udp_accepted(self):
        flow = parse_flow(minimal(protocol="UDP"))
        assert flow.protocol == "UDP"

    def test_zero_ports_accepted(self):
        flow = parse_flow(minimal(src_port=0, dst_port=0))
        assert flow.src_port == 0
        assert flow.dst_port == 0

    def test_max_ports_accepted(self):
        flow = parse_flow(minimal(src_port=65535, dst_port=65535))
        assert flow.src_port == 65535

    def test_zero_duration_accepted(self):
        flow = parse_flow(minimal(duration=0.0))
        assert flow.duration == 0.0


# ---------------------------------------------------------------------------
# Rejection tests — non-dict input
# ---------------------------------------------------------------------------


class TestParseFlowNonDict:
    @pytest.mark.parametrize("bad_input", [None, "string", 42, [1, 2, 3], True])
    def test_non_dict_raises_flow_parse_error(self, bad_input):
        with pytest.raises(FlowParseError) as exc_info:
            parse_flow(bad_input)
        assert "dict" in str(exc_info.value).lower() or "Expected" in str(exc_info.value)

    def test_non_dict_exposes_raw(self):
        bad = ["not", "a", "dict"]
        with pytest.raises(FlowParseError) as exc_info:
            parse_flow(bad)
        assert exc_info.value.raw is bad


# ---------------------------------------------------------------------------
# Rejection tests — missing required fields
# ---------------------------------------------------------------------------


class TestParseFlowMissingFields:
    @pytest.mark.parametrize(
        "missing_field",
        ["flow_id", "timestamp", "src_ip", "dst_ip", "protocol"],
    )
    def test_missing_required_field_raises(self, missing_field):
        record = {k: v for k, v in MINIMAL.items() if k != missing_field}
        with pytest.raises(FlowParseError):
            parse_flow(record)

    def test_empty_dict_raises(self):
        with pytest.raises(FlowParseError):
            parse_flow({})


# ---------------------------------------------------------------------------
# Rejection tests — constraint violations
# ---------------------------------------------------------------------------


class TestParseFlowConstraintViolations:
    def test_port_negative_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(src_port=-1))

    def test_port_too_large_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(dst_port=65536))

    def test_duration_negative_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(duration=-0.001))

    def test_packet_count_negative_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(packet_count=-1))

    def test_byte_count_negative_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(byte_count=-100))

    def test_invalid_direction_rejected(self):
        with pytest.raises(FlowParseError):
            parse_flow(minimal(direction="INVALID_DIR"))


# ---------------------------------------------------------------------------
# Error quality tests
# ---------------------------------------------------------------------------


class TestParseFlowErrorQuality:
    def test_error_has_reason_attribute(self):
        with pytest.raises(FlowParseError) as exc_info:
            parse_flow({})
        assert exc_info.value.reason
        assert isinstance(exc_info.value.reason, str)

    def test_error_has_raw_attribute(self):
        bad = minimal(src_port=-1)
        with pytest.raises(FlowParseError) as exc_info:
            parse_flow(bad)
        assert exc_info.value.raw is bad

    def test_error_message_is_human_readable(self):
        with pytest.raises(FlowParseError) as exc_info:
            parse_flow({"flow_id": "x"})
        msg = str(exc_info.value)
        assert len(msg) > 10  # not empty or trivial
