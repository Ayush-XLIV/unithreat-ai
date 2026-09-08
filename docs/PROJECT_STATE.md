# UniThreat AI Project State

## Current Phase
Phase 2 — Core Engine & Integration (Complete) → Transition to Phase 3: Dashboard & Presentation

## Current Task
Task 6: Alert Fusion + API/Streaming Layer — **COMPLETED**

## Overall Progress
- **Tasks Completed**: 6 of 8 (Tasks 1, 2, 3, 4, 4.1, 5, 6)
- **Status**: Backend processing, detection, ML, alert fusion, deduplication, bounded storage, REST API, and WebSocket streaming are fully integrated, verified against contracts, and covered by automated test suites.
- **Next Task**: Task 7 — Modern Dashboard UI (React/Vite) consuming REST and WebSocket endpoints.

---

## Completed Tasks

1. **Task 1 — Repository Foundation & Schema Contracts**
   - JSON Schema Draft 2020-12 contracts defined in `contracts/`:
     - `flow-schema.json`
     - `feature-schema.json`
     - `evidence-schema.json`
     - `alert-schema.json`
     - `ml-prediction-schema.json`
   - Strict `additionalProperties: false` enforcement across all contracts.

2. **Task 2 — Ingestion & Synthetic Traffic Generation**
   - Implemented streaming JSONL flow reader and replay iterator (`src/unithreat/ingest/`).
   - Implemented synthetic scenario generator (`src/unithreat/generator/`) supporting benign, ddos, port_scan, c2_beacon, dns_tunnel, exfiltration, dga, and encrypted_anomaly.

3. **Task 3 — Streaming Feature Extraction & Rolling Windows**
   - Implemented real-time single-flow and time-windowed feature calculation (`src/unithreat/features/`).
   - Calculates 37 canonical features adhering strictly to `contracts/feature-schema.json`.

4. **Task 4 & 4.1 — Statistical & Behavioral Detection Engines**
   - Implemented modular, passive, streaming detectors (`src/unithreat/detection/`):
     - `DDoSDetectionEngine`: Volumetric SYN/UDP flood, high flow rate, IP entropy.
     - `PortScanDetectionEngine`: Horizontal and vertical port sweep, fan-out.
     - `C2BeaconDetectionEngine`: Periodicity, interval variance, connection persistence.
     - `DNSDetectionEngine`: Shannon entropy, query length, n-gram bigram/trigram transition probabilities, DGA detection.
     - `ExfiltrationDetectionEngine`: Outbound byte volume, asymmetric ratio, sustained transfer.
     - `EncryptedAnomalyEngine`: TLS/QUIC packet size variance, duration, destination port anomalies.
   - Built evidence signals conforming to `contracts/evidence-schema.json`.

5. **Task 5 — ML Intelligence Layer**
   - Implemented tabular ML pipeline (`src/unithreat/ml/`):
     - `RandomForestClassifier` with median imputer.
     - Group-aware simulation-run splitting (`split_dataset_by_group`) preventing data leakage.
     - Strict contract conformity (`contracts/ml-prediction-schema.json`) with `calibrated: false`.
     - Model persistence in `artifacts/models/rf-baseline-v1/`.

6. **Task 6 — Alert Fusion + API/Streaming Layer (This Task)**
   - Implemented `AlertFusionEngine` (`src/unithreat/alerts/fusion.py`) handling 4 deterministic cases.
   - Implemented `AlertDeduplicator` (`src/unithreat/alerts/dedup.py`) with bounded LRU suppression.
   - Implemented `BoundedAlertStore` and `BoundedFlowStore` (`src/unithreat/alerts/store.py`).
   - Implemented `IntegratedPipeline` (`src/unithreat/alerts/pipeline.py`) unifying Ingest → Feature → Detection + ML → Fusion → Deduplication → Storage → Broadcast.
   - Implemented FastAPI backend (`src/unithreat/api/app.py`, `routes.py`) with all 7 required endpoints.
   - Implemented WebSocket streaming (`src/unithreat/api/stream.py`) with bounded queues and drop-oldest eviction.
   - Built live replay demonstration script (`scripts/demo_pipeline_api.py`).

---

## Task Currently In Progress
None. Task 6 is finished. Ready to begin Task 7 (UI / Dashboard).

---

## Files Created/Modified

### Task 6 Created Files:
- `src/unithreat/alerts/__init__.py` — Alert package public exports.
- `src/unithreat/alerts/models.py` — Pydantic `ThreatAlert` model conforming to `contracts/alert-schema.json`.
- `src/unithreat/alerts/fusion.py` — `AlertFusionEngine` with 4 deterministic cases and severity calculation.
- `src/unithreat/alerts/dedup.py` — `AlertDeduplicator` using bounded `OrderedDict` LRU cache.
- `src/unithreat/alerts/store.py` — `BoundedAlertStore` and `BoundedFlowStore` with thread-safe ring buffers.
- `src/unithreat/alerts/pipeline.py` — `IntegratedPipeline` orchestrating flow to alert stream.
- `src/unithreat/api/__init__.py` — API package public exports.
- `src/unithreat/api/stream.py` — `AlertStreamManager` with bounded per-client queues and drop-oldest policy.
- `src/unithreat/api/routes.py` — REST endpoints (`/health`, `/alerts`, `/alerts/{flow_id}`, `/flows/{flow_id}`, `/stats`, `/ingest/flow`, `/ws/alerts`).
- `src/unithreat/api/app.py` — FastAPI application factory with CORS middleware.
- `tests/alerts/__init__.py` — Test package init.
- `tests/alerts/test_fusion.py` — 6 tests for alert fusion logic and schema conformance.
- `tests/alerts/test_dedup.py` — 6 tests for deduplication, suppression window, and LRU eviction.
- `tests/alerts/test_store.py` — 8 tests for alert and flow stores, query filtering, and thread safety.
- `tests/api/__init__.py` — Test package init.
- `tests/api/test_routes.py` — 7 tests for REST endpoints and schema validation.
- `tests/api/test_stream.py` — 3 tests for WebSocket streaming and queue drop-oldest behavior.
- `tests/api/test_integration.py` — 1 comprehensive end-to-end integration test.
- `scripts/demo_pipeline_api.py` — CLI demonstration script simulating traffic replay through API and store.
- `docs/PROJECT_STATE.md` — Persistent project state tracking document.

### Modified Files:
- `pyproject.toml` — Added runtime dependencies (`fastapi`, `uvicorn`, `websockets`) and dev dependencies (`httpx`).
- `docs/architecture.md` — Documented Alert Fusion (Section 13.1), Deduplication, Bounded Storage, REST API, WebSocket Streaming, and the Passive Capture Boundary.

---

## Architecture Currently Implemented

```text
Synthetic Flow / Replay Source / POST /ingest/flow
                      │
                      ▼
             FeatureExtractor (37 features)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
DetectionEngine             MLInferenceEngine
(Statistical/Behavioral)    (Random Forest Baseline)
        │                           │
        └─────────────┬─────────────┘
                      ▼
              AlertFusionEngine
       (4 Explicit Deterministic Cases)
                      │
                      ▼
              AlertDeduplicator
          (LRU bounded, 60s window)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
BoundedAlertStore           AlertStreamManager
(deque maxlen=1000)         (asyncio.Queue maxsize=100)
        │                           │
        ▼                           ▼
REST API (FastAPI)          WebSocket (/ws/alerts)
```

---

## Contracts / Schemas

All payloads conform strictly to schemas located in `contracts/`:
- `contracts/flow-schema.json`: Flow records.
- `contracts/feature-schema.json`: 37 engineered numerical and categorical features.
- `contracts/evidence-schema.json`: Individual evidence signals with direction, reliability, and supporting features.
- `contracts/alert-schema.json`: Standardized alert output. Strict `additionalProperties: false`.
- `contracts/ml-prediction-schema.json`: ML classification output with uncalibrated voting scores.

---

## Tests

Test suite covers all layers:
- `tests/alerts/`: 20 tests (fusion, dedup, store)
- `tests/api/`: 11 tests (REST routes, WebSocket streaming, end-to-end flow to API)
- `tests/ml/`: 17 tests (dataset generation, feature extraction, training, inference, integration)
- `tests/detection/`: 120 tests (DDoS, port scan, C2 beacon, DNS tunnel/DGA, exfiltration, encrypted anomaly)
- `tests/features/`: 72 tests (extractors, rolling window, models)
- `tests/ingest/`: 37 tests (parser, schema validation, replay)
- `tests/generator/`: 8 tests (scenarios, variation, reproducibility)

**Total Test Count: 278 tests.**

---

## Latest Test Result

Executed on: 2026-09-08
Command: `.venv/bin/python -m pytest tests/ -v`
Result:
```text
======================= 278 passed, 2 warnings in 3.71s ========================
```
Demo execution (`.venv/bin/python scripts/demo_pipeline_api.py`):
```text
[+] Total flows processed: 80
[+] Total alerts stored in BoundedAlertStore: 41
[SUCCESS] All demonstration checks and contract validations passed!
```

---

## Git Status

Uncommitted changes (not committed or pushed per instructions):
```text
 M docs/architecture.md
 M pyproject.toml
 M src/unithreat/alerts/__init__.py
 M src/unithreat/api/__init__.py
?? docs/PROJECT_STATE.md
?? scripts/demo_pipeline_api.py
?? src/unithreat/alerts/dedup.py
?? src/unithreat/alerts/fusion.py
?? src/unithreat/alerts/models.py
?? src/unithreat/alerts/pipeline.py
?? src/unithreat/alerts/store.py
?? src/unithreat/api/app.py
?? src/unithreat/api/routes.py
?? src/unithreat/api/stream.py
?? tests/alerts/
?? tests/api/
```

---

## Known Issues

None. All 278 tests pass cleanly.
Starlette TestClient emits two harmless deprecation warnings regarding `httpx` vs `httpx2` and `anyio.abc.BlockingPortal`. These do not affect runtime API or WebSocket operation.

---

## Important Architectural Decisions

1. **Strict Passive Boundary**:
   - The system is completely passive and read-only.
   - Zero packet transmission, active network probing, handshake completion, or payload decryption.
   - `POST /ingest/flow` is strictly an internal application ingestion and replay endpoint. It has zero return path to monitored traffic.

2. **Deterministic Alert Fusion (Four Explicit Cases)**:
   - Case 1 (Statistical + ML agree): Statistical threat class preserved, confidence boosted by ML voting score, supporting evidence appended.
   - Case 2 (Statistical + ML disagree): Statistical threat class preserved, confidence dampened to 85% of base, contradicting evidence recorded.
   - Case 3 (Statistical only): Result preserved unchanged; no synthetic ML confidence added.
   - Case 4 (ML only): Treated as an ML hypothesis with conservative confidence (`min(0.75, score * 0.80)`); severity capped at `HIGH` (never `CRITICAL`).

3. **Uncalibrated ML Semantics**:
   - ML score represents the Random Forest ensemble tree voting ratio, not a calibrated Bayesian posterior probability.
   - `calibrated: false` is explicitly set on all ML prediction outputs.

4. **Bounded Memory & Protection Against Fatigue**:
   - `AlertDeduplicator` bounds memory with an `OrderedDict` LRU cache (10,000 keys) and 60-second suppression window per `(source_ip, destination_ip, threat_class)`.
   - Stores use ring buffers (`deque(maxlen=1000)`) instead of unbounded arrays.
   - WebSocket streaming queues use `asyncio.Queue(maxsize=100)` with a drop-oldest policy.

---

## Next Exact Step

**Task 7 — Modern Dashboard UI**:
1. Inspect requirements for dashboard views:
   - Overview metrics (total flows, total alerts, breakdown by threat class and severity).
   - Real-time live alert feed connecting to `WS /ws/alerts`.
   - Alert details drawer displaying forensic evidence signals, confidence, and explanations.
   - Flow replay controls calling `POST /ingest/flow`.
2. Scaffold React/Vite frontend in `frontend/` or equivalent workspace directory.
3. Verify end-to-end user interaction between UI, FastAPI backend, and detection pipeline.

---

## Resume Instructions

For any agent resuming this codebase:
1. Run `.venv/bin/python -m pytest tests/ -v` to ensure all 278 tests pass.
2. Run `.venv/bin/python scripts/demo_pipeline_api.py` to see the live pipeline in action.
3. Review `contracts/alert-schema.json` and `src/unithreat/api/routes.py` to understand the API data structures for the frontend.
4. Begin Task 7 (Dashboard UI).
