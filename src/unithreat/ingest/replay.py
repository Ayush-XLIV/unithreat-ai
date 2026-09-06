"""
unithreat.ingest.replay  [DEPRECATED — do not import from here]
================================================================

This module has been **relocated** to::

    unithreat.ingest.adapters.jsonl

Update all imports to use the new path.  This shim will be removed in a
future cleanup pass once all internal references have been updated.
"""

from __future__ import annotations

import warnings as _warnings

_warnings.warn(
    "unithreat.ingest.replay is deprecated. "
    "Import from unithreat.ingest.adapters.jsonl instead.",
    DeprecationWarning,
    stacklevel=2,
)

# Re-export everything so existing call sites keep working during migration.
from unithreat.ingest.adapters.jsonl import (  # noqa: E402, F401
    JsonlAdapter,
    replay_jsonl,
)

__all__ = ["replay_jsonl", "JsonlAdapter"]
