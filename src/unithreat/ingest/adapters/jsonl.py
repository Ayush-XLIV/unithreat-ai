"""
unithreat.ingest.adapters.jsonl
================================

JSONL file replay adapter — **development and demonstration use only**.

Purpose
-------
This adapter reads pre-captured or synthetically generated flow records
from a JSON Lines (``.jsonl``) file and yields them as normalized
:class:`~unithreat.ingest.models.Flow` objects, one at a time.

It is **not** an intended production ingest path.  Its role is to:

* provide a reproducible, file-based input for unit tests and CI;
* allow demonstrations without live network access or a running capture
  daemon;
* serve as the simplest possible conforming ``FlowSource`` implementation,
  illustrating the adapter contract for future adapters.

Relationship to the adapter architecture
-----------------------------------------
All adapters — including this one — satisfy the
:class:`~unithreat.ingest.source.FlowSource` protocol::

    source: FlowSource = JsonlAdapter("data/sample.jsonl")
    for flow in source:
        pipeline.process(flow)

The :func:`replay_jsonl` generator function is the functional form of the
same adapter and is interchangeable with ``JsonlAdapter`` in any context
that accepts ``Iterable[Flow]``.

Design principles
-----------------
* **Strictly read-only** — the source file is opened for reading only.
  No network connections, packet injection, or traffic modification occurs.
* **Incremental / streaming** — the file is read line-by-line so the
  entire dataset is never loaded into memory simultaneously.
* **Near-real-time simulation** — an optional ``speed_factor`` scales the
  inter-flow delay derived from the ``timestamp`` field, approximating
  original capture cadence.

Usage
-----
Functional form::

    from unithreat.ingest.adapters.jsonl import replay_jsonl

    for flow in replay_jsonl("data/sample.jsonl", speed_factor=1.0):
        print(flow.flow_id, flow.src_ip)

Class form (satisfies ``FlowSource`` protocol)::

    from unithreat.ingest.adapters.jsonl import JsonlAdapter

    source = JsonlAdapter("data/sample.jsonl", speed_factor=0.0)
    for flow in source:
        print(flow.flow_id)
"""

from __future__ import annotations

import json
import time
import warnings
from collections.abc import Generator, Iterator
from pathlib import Path
from typing import IO

from unithreat.ingest.models import Flow
from unithreat.ingest.parser import FlowParseError, parse_flow


# ---------------------------------------------------------------------------
# Functional API — generator function
# ---------------------------------------------------------------------------


def replay_jsonl(
    source: str | Path | IO[str],
    *,
    speed_factor: float = 0.0,
    skip_malformed: bool = False,
) -> Generator[Flow, None, None]:
    """
    Yield :class:`~unithreat.ingest.models.Flow` objects from a JSONL file
    one record at a time, simulating near-real-time traffic when requested.

    **Development / demo use only.**  For production ingest, use the
    appropriate adapter for your traffic source (PCAP, NetFlow, IPFIX …).

    Parameters
    ----------
    source:
        Path to a JSONL file **or** any readable text-mode file-like object.
        The source is treated as read-only.
    speed_factor:
        Controls replay timing relative to the original capture cadence.

        * ``0.0`` (default) — no delay; replay as fast as possible.
        * ``1.0`` — real-time; sleep proportionally to the wall-clock gap
          between consecutive flow timestamps.
        * ``0.5`` — half-speed; double the original delays.
        * ``2.0`` — double-speed; halve the original delays.

        Values > 0 require valid ``timestamp`` fields on consecutive flows.
        If the gap is negative (disordered events) the sleep is skipped.
    skip_malformed:
        If ``True``, emit a :class:`Warning` and continue on bad records.
        If ``False`` (default), the first malformed record raises immediately.

    Yields
    ------
    Flow
        Validated, immutable flow events in file order.

    Raises
    ------
    FlowParseError
        When ``skip_malformed=False`` and a record is malformed.
    json.JSONDecodeError
        When ``skip_malformed=False`` and a line is not valid JSON.
    FileNotFoundError
        When ``source`` is a path that does not exist.
    """
    yield from _open_and_stream(source, speed_factor=speed_factor, skip_malformed=skip_malformed)


# ---------------------------------------------------------------------------
# Class API — satisfies FlowSource protocol
# ---------------------------------------------------------------------------


class JsonlAdapter:
    """
    JSONL replay adapter conforming to :class:`~unithreat.ingest.source.FlowSource`.

    **Development / demo use only.**

    Parameters
    ----------
    source:
        Path to a JSONL file or a readable text-mode file-like object.
    speed_factor:
        See :func:`replay_jsonl`.
    skip_malformed:
        See :func:`replay_jsonl`.
    """

    def __init__(
        self,
        source: str | Path | IO[str],
        *,
        speed_factor: float = 0.0,
        skip_malformed: bool = False,
    ) -> None:
        self._source = source
        self._speed_factor = speed_factor
        self._skip_malformed = skip_malformed

    def __iter__(self) -> Iterator[Flow]:
        yield from replay_jsonl(
            self._source,
            speed_factor=self._speed_factor,
            skip_malformed=self._skip_malformed,
        )

    def __repr__(self) -> str:
        return (
            f"JsonlAdapter({self._source!r}, "
            f"speed_factor={self._speed_factor!r}, "
            f"skip_malformed={self._skip_malformed!r})"
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _open_and_stream(
    source: str | Path | IO[str],
    *,
    speed_factor: float,
    skip_malformed: bool,
) -> Generator[Flow, None, None]:
    """Dispatch between file-like objects and path strings/Paths."""
    if hasattr(source, "read"):
        yield from _stream_lines(source, speed_factor=speed_factor, skip_malformed=skip_malformed)
    else:
        path = Path(source)
        with path.open(encoding="utf-8") as fh:
            yield from _stream_lines(fh, speed_factor=speed_factor, skip_malformed=skip_malformed)


def _stream_lines(
    fh: IO[str],
    *,
    speed_factor: float,
    skip_malformed: bool,
) -> Generator[Flow, None, None]:
    """Core line-by-line streaming loop."""

    prev_flow_ts: float | None = None
    prev_wall_ts: float | None = None

    for lineno, raw_line in enumerate(fh, start=1):
        line = raw_line.strip()
        if not line:
            continue

        # --- JSON decoding ---
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            if skip_malformed:
                warnings.warn(
                    f"[jsonl] Line {lineno}: JSON decode error — {exc}. Skipping.",
                    stacklevel=2,
                )
                continue
            raise

        # --- Schema + model validation ---
        try:
            flow = parse_flow(record)
        except FlowParseError as exc:
            if skip_malformed:
                warnings.warn(
                    f"[jsonl] Line {lineno}: {exc}. Skipping.",
                    stacklevel=2,
                )
                continue
            raise

        # --- Timing simulation ---
        if speed_factor > 0.0:
            flow_ts = flow.timestamp.timestamp()
            wall_now = time.monotonic()

            if prev_flow_ts is not None and prev_wall_ts is not None:
                flow_gap = flow_ts - prev_flow_ts
                if flow_gap > 0.0:
                    wall_gap = wall_now - prev_wall_ts
                    target_gap = flow_gap / speed_factor
                    remaining = target_gap - wall_gap
                    if remaining > 0.0:
                        time.sleep(remaining)

            prev_flow_ts = flow_ts
            prev_wall_ts = time.monotonic()

        yield flow
