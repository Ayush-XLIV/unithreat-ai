"""
tests/ingest/test_models.py
===========================

Unit tests for unithreat.ingest.models.Flow.

Covers:
- Required field acceptance
- Optional field defaults
- Type coercion (timestamp string → datetime)
- Field constraint enforcement (port range, duration >= 0, etc.)
- Immutability (frozen model)
- Direction enum values
- Protocol-metadata sub-objects (dns, tls, quic)
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from unithreat.ingest.models import Flow

# ---------------------------------------------------------------------------
# Minimal valid record
# ---------------------------------------------------------------------------

MINIMAL = {
    "flow_id": "flow-001",
    "timestamp": "2026-09-05T10:00:00Z",
    "src_ip": "192.168.1.10",
    "dst_ip": "10.0.0.1",
    "protocol": "TCP",
}


def minimal(**overrides):
    """Return a copy of MINIMAL with optional overrides."""
    return {**MINIMAL, **overrides}


# ---------------------------------------------------------------------------
# Construction tests
# ---------------------------------------------------------------------------


class TestFlowConstruction:
    def test_minimal_required_fields(self):
        flow = Flow.model_validate(MINIMAL)
        assert flow.flow_id == "flow-001"
        assert flow.src_ip == "192.168.1.10"
        assert flow.dst_ip == "10.0.0.1"
        assert flow.protocol == "TCP"

    def test_timestamp_parsed_from_string(self):
        flow = Flow.model_validate(MINIMAL)
        # Must be a datetime after coercion
        from datetime import datetime
        assert isinstance(flow.timestamp, datetime)

    def test_optional_fields_default_to_none(self):
        flow = Flow.model_validate(MINIMAL)
        assert flow.src_port is None
        assert flow.dst_port is None
        assert flow.direction is None
        assert flow.duration is None
        assert flow.packet_count is None
        assert flow.byte_count is None
        assert flow.tcp_flags is None
        assert flow.dns is None
        assert flow.tls is None
        assert flow.quic is None

    def test_all_optional_fields_accepted(self):
        record = minimal(
            src_port=54321,
            dst_port=443,
            direction="outbound",
            duration=1.5,
            packet_count=10,
            byte_count=1024,
            tcp_flags="SYN",
            dns={"query": "example.com", "qtype": "A"},
            tls={"version": "TLS 1.3"},
            quic={"version": "1"},
        )
        flow = Flow.model_validate(record)
        assert flow.src_port == 54321
        assert flow.dst_port == 443
        assert flow.direction == "outbound"
        assert flow.duration == 1.5
        assert flow.packet_count == 10
        assert flow.byte_count == 1024
        assert flow.tcp_flags == "SYN"
        assert flow.dns == {"query": "example.com", "qtype": "A"}

    def test_null_optional_fields_accepted(self):
        """JSON null for optional fields must be accepted."""
        record = minimal(
            src_port=None,
            dst_port=None,
            direction=None,
            duration=None,
            packet_count=None,
            byte_count=None,
            tcp_flags=None,
            dns=None,
            tls=None,
            quic=None,
        )
        flow = Flow.model_validate(record)
        assert flow.src_port is None
        assert flow.direction is None


# ---------------------------------------------------------------------------
# Direction enum tests
# ---------------------------------------------------------------------------


class TestDirection:
    @pytest.mark.parametrize("direction", ["inbound", "outbound", "internal", "unknown"])
    def test_valid_directions(self, direction):
        flow = Flow.model_validate(minimal(direction=direction))
        assert flow.direction == direction

    def test_null_direction_accepted(self):
        flow = Flow.model_validate(minimal(direction=None))
        assert flow.direction is None

    def test_invalid_direction_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(direction="INVALID"))


# ---------------------------------------------------------------------------
# Port range tests
# ---------------------------------------------------------------------------


class TestPortRange:
    def test_port_zero_accepted(self):
        flow = Flow.model_validate(minimal(src_port=0, dst_port=0))
        assert flow.src_port == 0

    def test_port_max_accepted(self):
        flow = Flow.model_validate(minimal(src_port=65535, dst_port=65535))
        assert flow.dst_port == 65535

    def test_port_negative_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(src_port=-1))

    def test_port_too_large_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(dst_port=65536))


# ---------------------------------------------------------------------------
# Numeric constraint tests
# ---------------------------------------------------------------------------


class TestNumericConstraints:
    def test_duration_zero_accepted(self):
        flow = Flow.model_validate(minimal(duration=0.0))
        assert flow.duration == 0.0

    def test_duration_negative_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(duration=-1.0))

    def test_packet_count_zero_accepted(self):
        flow = Flow.model_validate(minimal(packet_count=0))
        assert flow.packet_count == 0

    def test_packet_count_negative_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(packet_count=-1))

    def test_byte_count_zero_accepted(self):
        flow = Flow.model_validate(minimal(byte_count=0))
        assert flow.byte_count == 0

    def test_byte_count_negative_rejected(self):
        with pytest.raises(ValidationError):
            Flow.model_validate(minimal(byte_count=-10))


# ---------------------------------------------------------------------------
# Required field tests
# ---------------------------------------------------------------------------


class TestRequiredFields:
    @pytest.mark.parametrize("missing_field", ["flow_id", "timestamp", "src_ip", "dst_ip", "protocol"])
    def test_missing_required_field_rejected(self, missing_field):
        record = {k: v for k, v in MINIMAL.items() if k != missing_field}
        with pytest.raises(ValidationError):
            Flow.model_validate(record)


# ---------------------------------------------------------------------------
# Immutability tests
# ---------------------------------------------------------------------------


class TestImmutability:
    def test_flow_is_frozen(self):
        flow = Flow.model_validate(MINIMAL)
        with pytest.raises(ValidationError):
            flow.flow_id = "tampered"  # type: ignore[misc]
