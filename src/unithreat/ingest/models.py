"""
unithreat.ingest.models
=======================

Typed data model for a normalized passive flow event.

The schema is governed by contracts/flow-schema.json.
This module must stay in sync with that contract.

Only fields that appear in the JSON schema are present here.
No ML, detection, or feature-engineering logic belongs in this module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Direction literal — kept in sync with flow-schema.json enum values
# ---------------------------------------------------------------------------

Direction = Literal["inbound", "outbound", "internal", "unknown"] | None


class Flow(BaseModel):
    """
    Normalized passive flow event.

    Mirrors contracts/flow-schema.json exactly.
    All optional fields default to None when absent.
    The model is immutable after construction (model_config frozen=True)
    to reflect the read-only nature of ingest data.
    """

    model_config = {"frozen": True}

    # Required fields (schema: "required")
    flow_id: str
    timestamp: datetime
    src_ip: str
    dst_ip: str
    protocol: str

    # Optional flow fields
    src_port: int | None = Field(default=None, ge=0, le=65535)
    dst_port: int | None = Field(default=None, ge=0, le=65535)
    direction: Direction = None
    duration: float | None = Field(default=None, ge=0.0)
    packet_count: int | None = Field(default=None, ge=0)
    byte_count: int | None = Field(default=None, ge=0)
    tcp_flags: str | None = None

    # Optional protocol-metadata sub-objects (validated by schema; stored as-is)
    dns: dict[str, Any] | None = None
    tls: dict[str, Any] | None = None
    quic: dict[str, Any] | None = None

    # ------------------------------------------------------------------
    # Validators
    # ------------------------------------------------------------------

    @field_validator("timestamp", mode="before")
    @classmethod
    def _parse_timestamp(cls, v: object) -> object:
        """Accept ISO 8601 strings; pass through datetime objects."""
        if isinstance(v, str):
            # datetime.fromisoformat handles the common subset; pydantic
            # handles the rest natively in its own pipeline.
            return v
        return v
