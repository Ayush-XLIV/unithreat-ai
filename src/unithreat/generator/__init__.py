"""
unithreat.generator
===================

Synthetic traffic and flow data generation utilities for UniThreat AI.

Exported
--------
``TrafficGenerator``
    Class for stateful, scenario-based flow generation.
``generate_flows``
    Convenience function yielding schema-compliant flow records.
``write_flows_jsonl``
    Helper to serialize generated flow streams to JSONL files or stdout.
``VALID_SCENARIOS``
    Tuple of supported scenario identifiers.
"""

from unithreat.generator.traffic import (
    ATTACK_TYPE_ALIASES,
    DEFAULT_START_TIME,
    SUPPORTED_ATTACK_TYPES,
    ConfigurableTrafficGenerator,
    TrafficGenerator,
    VALID_SCENARIOS,
    generate_flows,
    main,
    write_flows_jsonl,
)

__all__ = [
    "ATTACK_TYPE_ALIASES",
    "ConfigurableTrafficGenerator",
    "DEFAULT_START_TIME",
    "SUPPORTED_ATTACK_TYPES",
    "TrafficGenerator",
    "VALID_SCENARIOS",
    "generate_flows",
    "main",
    "write_flows_jsonl",
]
