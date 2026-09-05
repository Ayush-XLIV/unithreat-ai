import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[2]
CONTRACTS_DIR = ROOT / "contracts"

SCHEMAS = [
    "flow-schema.json",
    "feature-schema.json",
    "evidence-schema.json",
    "ml-prediction-schema.json",
    "alert-schema.json",
]


@pytest.mark.parametrize("filename", SCHEMAS)
def test_schema_is_valid(filename):
    schema_path = CONTRACTS_DIR / filename

    assert schema_path.exists(), f"Missing contract: {filename}"

    with schema_path.open(encoding="utf-8") as file:
        schema = json.load(file)

    Draft202012Validator.check_schema(schema)


def load_schema(filename):
    with (CONTRACTS_DIR / filename).open(encoding="utf-8") as file:
        return json.load(file)


def test_feature_record_contract_accepts_valid_record():
    schema = load_schema("feature-schema.json")

    record = {
        "flow_id": "flow-001",
        "timestamp": "2026-09-05T10:00:00Z",
        "entity_id": "host-001",
        "window_id": "window-001",
        "features": {
            "packets_per_sec": 100.0,
            "bytes_per_sec": 5000.0,
        },
    }

    Draft202012Validator(schema).validate(record)


def test_feature_record_contract_rejects_missing_required_field():
    schema = load_schema("feature-schema.json")

    record = {
        "timestamp": "2026-09-05T10:00:00Z",
        "features": {
            "packets_per_sec": 100.0,
        },
    }

    with pytest.raises(Exception):
        Draft202012Validator(schema).validate(record)


def test_ml_prediction_contract_accepts_valid_prediction():
    schema = load_schema("ml-prediction-schema.json")

    prediction = {
        "flow_id": "flow-001",
        "threat_class": "DDOS",
        "score": 0.94,
        "model_version": "baseline-v1",
        "calibrated": False,
    }

    Draft202012Validator(schema).validate(prediction)


def test_evidence_contract_accepts_valid_signal():
    schema = load_schema("evidence-schema.json")

    evidence = {
        "signal_name": "high_packet_rate",
        "value": 0.91,
        "direction": "supporting",
        "reliability": 0.95,
        "supporting_features": [
            "packets_per_sec",
            "bytes_per_sec",
        ],
        "threat_class": "DDOS",
    }

    Draft202012Validator(schema).validate(evidence)


def test_alert_contract_accepts_valid_alert():
    schema = load_schema("alert-schema.json")
    evidence_schema = load_schema("evidence-schema.json")

    alert = {
        "timestamp": "2026-09-05T10:00:00Z",
        "flow_id": "flow-001",
        "threat_class": "DDOS",
        "confidence": 0.94,
        "severity": "HIGH",
        "evidence": [
            {
                "signal_name": "high_packet_rate",
                "value": 0.91,
                "direction": "supporting",
                "reliability": 0.95,
                "supporting_features": ["packets_per_sec"],
                "threat_class": "DDOS",
            }
        ],
        "source_ip": "10.0.0.10",
        "destination_ip": "10.0.0.20",
        "protocol": "TCP",
        "model_version": "baseline-v1",
        "explanation": "High packet rate supported by behavioral evidence.",
    }

    from referencing import Registry, Resource

    registry = Registry().with_resources(
        [
            (
                "evidence-schema.json",
                Resource.from_contents(evidence_schema),
            )
        ]
    )

    Draft202012Validator(
        schema,
        registry=registry,
    ).validate(alert)