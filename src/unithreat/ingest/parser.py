"""
unithreat.ingest.parser
=======================

Parses and validates a single raw flow record.

Responsibilities
----------------
1. Validate the raw dict against contracts/flow-schema.json using jsonschema.
2. Construct a typed, immutable ``Flow`` model from the validated data.
3. Raise ``FlowParseError`` with a human-readable message for any malformed
   record so callers can handle rejection cleanly.

This module is strictly read-only with respect to the observed network.
It performs no I/O and emits no traffic.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from pydantic import ValidationError as PydanticValidationError

from unithreat.ingest.models import Flow

# ---------------------------------------------------------------------------
# Schema loading — resolved once at import time
# ---------------------------------------------------------------------------

_CONTRACTS_DIR = Path(__file__).resolve().parents[3] / "contracts"
_SCHEMA_PATH = _CONTRACTS_DIR / "flow-schema.json"

with _SCHEMA_PATH.open(encoding="utf-8") as _f:
    _FLOW_SCHEMA: dict[str, Any] = json.load(_f)

_VALIDATOR = Draft202012Validator(_FLOW_SCHEMA)


# ---------------------------------------------------------------------------
# Public exception
# ---------------------------------------------------------------------------


class FlowParseError(ValueError):
    """
    Raised when a raw record cannot be parsed into a valid Flow.

    Attributes
    ----------
    raw:
        The original dict that failed validation.
    reason:
        Human-readable description of the failure.
    """

    def __init__(self, reason: str, raw: Any = None) -> None:
        super().__init__(reason)
        self.reason = reason
        self.raw = raw


# ---------------------------------------------------------------------------
# Public parser
# ---------------------------------------------------------------------------


def parse_flow(raw: Any) -> Flow:
    """
    Validate and convert a single raw record into a :class:`Flow`.

    Parameters
    ----------
    raw:
        A Python dict decoded from a JSON flow record.  Any other type
        (str, list, None …) is immediately rejected.

    Returns
    -------
    Flow
        Immutable, fully typed flow event.

    Raises
    ------
    FlowParseError
        For any malformed, missing-field, or type-invalid input.
    """
    if not isinstance(raw, dict):
        raise FlowParseError(
            f"Expected a JSON object (dict), got {type(raw).__name__!r}.",
            raw=raw,
        )

    # --- JSON Schema validation (structural + type constraints) ---
    errors = list(_VALIDATOR.iter_errors(raw))
    if errors:
        first_error: ValidationError = errors[0]
        path = " -> ".join(str(p) for p in first_error.absolute_path) or "<root>"
        raise FlowParseError(
            f"Schema validation failed at {path!r}: {first_error.message}",
            raw=raw,
        )

    # --- Pydantic model construction (type coercion + business constraints) ---
    try:
        return Flow.model_validate(raw)
    except PydanticValidationError as exc:
        raise FlowParseError(
            f"Flow model validation failed: {exc}",
            raw=raw,
        ) from exc
