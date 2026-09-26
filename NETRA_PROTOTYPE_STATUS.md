# NETRA AI (UniThreat AI) — Prototype Status & Technical Architecture Report

**Project Name:** NETRA AI (UniThreat AI)  
**Hackathon / Problem Statement:** Smart India Hackathon (SIH 2026) — Problem Statement 26145  
**Title:** AI-Based Detection of Cyber Threats in Unidirectional IP Traffic  
**Sponsoring Organization:** National Technical Research Organisation (NTRO)  
**Evaluation Repository Path:** `/home/ayush/sihproject/unithreat-ai`  
**Current State:** Phase 6.2 Completed (Live Backend & Frontend Integrated; All 310 Backend & 125 Frontend Tests Passing)  
**Report File:** `NETRA_PROTOTYPE_STATUS.md`

---

## Executive Summary

NETRA AI is a passive, streaming cybersecurity threat intelligence system specifically designed to operate inside a **strictly unidirectional monitoring enclave** (e.g., behind a hardware data diode or passive optical TAP). 

In this environment, network traffic flows in **one direction only**—from the monitored infrastructure into the detection enclave. The system has **no physical or logical return path**:
- It **cannot** send packets or responses back to monitored endpoints.
- It **cannot** complete TCP handshakes or issue active network probes.
- It **cannot** execute active inline blocking or firewall mitigations.
- It **cannot** decrypt TLS/QUIC encrypted payloads (it inspects passive metadata only).

To solve Problem Statement 26145 under these physical constraints, NETRA AI implements an **evidence-fusion architecture**: it extracts 37 passive flow features, evaluates sliding-window behavioral context, executes 6 modular statistical/behavioral detectors, runs a tabular Random Forest machine learning classifier, and deterministically fuses these independent evidence signals into standardized, explainable cybersecurity threat alerts.

The prototype is **fully functional end-to-end**, connecting a high-performance Python/FastAPI backend with a React 19 SOC Operations Console via REST APIs and a real-time WebSocket alert stream.

---

## 1. What Features and Modules We Have Implemented

Every module listed below is genuinely implemented, tested, and verifiable in the repository.

```
unithreat-ai/
├── contracts/               # JSON Schema Draft 2020-12 specifications (Source of Truth)
├── src/unithreat/
│   ├── ingest/              # Streaming flow ingestion, JSONL replay, Pydantic parsing
│   ├── generator/           # 8-scenario synthetic traffic simulation engine
│   ├── features/            # 37-feature streaming extractor & temporal window tracker
│   ├── detection/           # 6 statistical & behavioral detection engines + window manager
│   ├── ml/                  # Tabular ML pipeline (Random Forest, group splitting, inference)
│   ├── alerts/              # Deterministic 4-case fusion engine, deduplicator, bounded stores
│   └── api/                 # FastAPI REST API (7 query endpoints) & WebSocket alert stream
├── frontend/                # React 19 SOC Operations Console (Vite, Tailwind, Recharts)
│   ├── src/services/        # HttpDataService (REST) & WebSocketService (Live Stream)
│   ├── src/components/      # SOC widgets, badges, gauges, drawers, and forensic panels
│   └── src/pages/           # 9 operational views (Overview, Alerts, Flows, ML, System, etc.)
├── scripts/                 # Live replay demos, performance benchmarks, and lab validators
├── artifacts/               # Serialized ML model (rf-baseline-v1) and benchmark results
└── tests/                   # 310 backend pytest tests + 125 frontend vitest tests
```

### Module Breakdown & Implemented Capabilities

| Subsystem | Key Files | Concrete Implemented Capabilities |
|---|---|---|
| **Authoritative Contracts** | `contracts/*.json` | Draft 2020-12 schemas with strict `additionalProperties: false` for `flow-schema.json`, `feature-schema.json`, `evidence-schema.json`, `alert-schema.json`, and `ml-prediction-schema.json`. |
| **Ingestion Engine** | `src/unithreat/ingest/` | Streaming JSONL file parser (`adapters/jsonl.py`), replay iterator (`replay.py`), and strict schema validation (`parser.py`). |
| **Traffic Generator** | `src/unithreat/generator/` | Realistic traffic generation across 8 distinct scenarios (`traffic.py`): Benign, DDoS, Port Scan, C2 Beacon, DNS Tunnel, DGA, Data Exfiltration, and Encrypted Anomaly. |
| **Feature Extraction** | `src/unithreat/features/` | 37 canonical features (`extractor.py`), zero-duration division-by-zero protection, DNS Shannon entropy & lexical analysis, TLS/QUIC metadata parsing, and stateful sliding window aggregations (`window.py`). |
| **Detection Engines** | `src/unithreat/detection/` | 6 specialized behavioral detectors (`ddos.py`, `port_scan.py`, `beacon.py`, `dns.py`, `encrypted.py`, `exfiltration.py`) coordinated by `engine.py` with in-memory bounded state (`window.py`). |
| **ML Intelligence** | `src/unithreat/ml/` | Tabular `RandomForestClassifier` with median imputer (`pipeline.py`), simulation group-aware train/test splitting to prevent data leakage (`dataset.py`), and sub-3ms single-flow inference (`inference.py`). |
| **Alert Fusion** | `src/unithreat/alerts/fusion.py` | 4-case deterministic fusion engine combining statistical evidence with ML predictions; calculates explainable evidence signals. |
| **Alert Deduplication** | `src/unithreat/alerts/dedup.py` | LRU-bounded cache (10,000 keys) with a 60-second sliding suppression window to prevent alert fatigue. |
| **Bounded Storage** | `src/unithreat/alerts/store.py` | Thread-safe ring buffers using `collections.deque` with strict caps (`maxlen=1000` for alerts, `maxlen=2000` for flows, features, and predictions). Prevents memory exhaustion. |
| **Backend REST & WS** | `src/unithreat/api/` | FastAPI application (`app.py`, `routes.py`) providing 10 endpoints, CORS middleware, and WebSocket streaming manager (`stream.py`) with bounded queues (max 100 alerts) and drop-oldest eviction. |
| **Frontend Data Services** | `frontend/src/services/` | `HttpDataService.ts` executing all REST queries without inventing intelligence; `WebSocketService.ts` handling live alert streaming with auto-reconnect backoff. |
| **Frontend SOC Console** | `frontend/src/` | Dark-first SOC Operations Console built with React 19, Tailwind CSS, Recharts, and Motion; 9 views and modular forensic investigation panels. |

---

## 2. How the Complete System Works (From Ingestion to Alert Generation)

```
                       PASSIVE ONE-WAY TRAFFIC INGRESS
                                     │
                                     ▼ (Strict Read-Only Boundary)
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. INGESTION & VALIDATION                                               │
│    Flow JSON / Replay Stream -> Pydantic Validation (Flow Model)        │
│    -> Appended to BoundedFlowStore (Ring Buffer maxlen=2000)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. STREAMING FEATURE EXTRACTION                                         │
│    FeatureExtractor calculates 37 canonical metrics:                    │
│    - Rates (packets/sec, bytes/sec) with zero-duration protection       │
│    - Shannon entropy & DNS n-gram lexical analysis                      │
│    - TLS/QUIC metadata (JA3, ciphers, IP-as-SNI flag)                  │
│    - Sliding-window aggregations (fan-out, fan-in, inter-arrival time)  │
│    -> Appended to BoundedFeatureStore (Ring Buffer maxlen=2000)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│ 3A. STATISTICAL & BEHAVIORAL ENGINES │  │ 3B. ML INFERENCE ENGINE       │
│     Evaluates bounded entity context │  │     Converts 37 features into │
│     across sliding windows:          │  │     numeric vector.           │
│     - DDoSDetector                   │  │     RandomForestClassifier    │
│     - PortScanDetector               │  │     predicts threat class &   │
│     - C2BeaconDetector               │  │     uncalibrated voting score.│
│     - DNSDetector (Tunnel + DGA)     │  │     -> BoundedPredictionStore │
│     - ExfiltrationDetector           │  │        (Ring Buffer 2000)     │
│     - EncryptedSessionDetector       │  │                               │
│     -> Outputs DetectionResults      │  │                               │
└──────────────────┬───────────────────┘  └───────────────┬───────────────┘
                   │                                      │
                   └─────────────────┬────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. ALERT FUSION ENGINE (AlertFusionEngine)                              │
│    Deterministic reconciliation across 4 explicit cases:                │
│    Case 1: Statistical + ML Agree -> Boost confidence, add support signal│
│    Case 2: Statistical + ML Disagree -> Dampen conf 15%, add div signal │
│    Case 3: Statistical Only -> Preserve detection result unchanged      │
│    Case 4: ML Only -> Form ML hypothesis (confidence capped, never CRIT)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. DEDUPLICATION (AlertDeduplicator)                                    │
│    LRU Cache on (src_ip, dst_ip, threat_class).                         │
│    Suppresses redundant alerts within 60-second window.                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. BOUNDED STORAGE & REALTIME BROADCAST                                 │
│    - Stored in BoundedAlertStore (Ring Buffer maxlen=1000)              │
│    - Broadcast via AlertStreamManager to active WebSocket subscribers   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. ANALYST SOC CONSOLE (React 19 Frontend)                              │
│    - WebSocketService receives live alert JSON                          │
│    - Live Alert table & KPI metric counters update instantly            │
│    - Analyst drills down: Alert -> Flow Record -> 37 Features -> ML Pred│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend and Frontend Structure & Connection

### Backend Architecture (`src/unithreat/`)
The backend is built with Python 3.12+ and FastAPI. It runs asynchronously under Uvicorn and follows a strict separation of concerns:
- **`unithreat.alerts.pipeline.IntegratedPipeline`**: The single orchestrator connecting feature extraction, detection engines, ML inference, fusion, deduplication, storage, and streaming.
- **`unithreat.api.routes`**: Defines 10 API endpoints:
  - `GET /health`: Operational health, pipeline counters, and ML status.
  - `GET /stats`: Aggregated metrics (total flows, total alerts, breakdown by threat class and severity).
  - `GET /alerts`: Query stored alerts with newest-first ordering and filters (`threat_class`, `severity`, `min_confidence`, `limit`).
  - `GET /alerts/{flow_id}`: Fetch the alert associated with a specific flow.
  - `GET /flows`: Query recent raw passive flows with filters (`protocol`, `src_ip`, `dst_ip`, `limit`).
  - `GET /flows/{flow_id}`: Fetch raw flow network tuple and metadata.
  - `GET /features/{flow_id}`: Fetch the 37 extracted features for a flow.
  - `GET /predictions/{flow_id}`: Fetch the ML prediction record for a flow.
  - `POST /ingest/flow`: Ingest a single raw flow JSON record into the pipeline.
  - `WS /ws/alerts`: Persistent WebSocket stream delivering alerts in real time.

### Frontend Architecture (`frontend/src/`)
The frontend is a single-page application built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Motion:
- **`services/HttpDataService.ts`**: Implements the `DataService` contract interface. Queries backend REST endpoints using native `fetch`. It strictly avoids inventing fake metrics or cybersecurity intelligence.
- **`services/WebSocketService.ts`**: Connects to `WS /ws/alerts`. Implements an exponential backoff auto-reconnect state machine (`CONNECTING`, `CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `CLOSED`), deduplicates incoming alerts, and maintains a bounded client buffer of the latest 100 alerts.
- **`components/layout/AppShell.tsx` & `TopHeader.tsx`**: Manages the global WebSocket connection lifecycle and displays a real-time status pill (`LIVE BACKEND — REALTIME DETECTION`).
- **`pages/AlertsPage.tsx` & `pages/OverviewPage.tsx`**: Subscribe to `WebSocketService`. When new threats are detected, the UI updates dynamically without full-page reloads.

### Connection & Proxy Layer
In development, the Vite dev server (`frontend/vite.config.ts`) provides a transparent reverse proxy:
- `/api/*` -> proxies to `http://localhost:8000/*`
- `/ws/*` -> proxies WebSocket connections to `ws://localhost:8000/*`

This eliminates CORS issues and allows the frontend to run either in development (`npm run dev`) or as a static production build (`npm run build`) served behind Nginx or FastAPI.

---

## 4. AI/ML Models and Detection Algorithms

### 4.1 Tabular Machine Learning Layer

NETRA AI employs a tabular supervised machine learning classifier to learn complex non-linear relationships across flow features:

- **Algorithm:** `RandomForestClassifier` from `scikit-learn` in a pipeline with `SimpleImputer(strategy="median")`.
- **Pre-trained Artifact:** Persisted on disk at `artifacts/models/rf-baseline-v1/model.joblib` and `metadata.json`.
- **Hyperparameters:**
  - `n_estimators`: 100 decision trees
  - `max_depth`: 15
  - `class_weight`: `"balanced"` (handles class imbalances)
  - `random_state`: 42 (deterministic reproducibility)
- **Threat Taxonomy (8 Classes):**
  1. `BENIGN`
  2. `DDOS`
  3. `C2_BEACONING`
  4. `DGA`
  5. `DNS_TUNNELING`
  6. `RECONNAISSANCE`
  7. `DATA_EXFILTRATION`
  8. `ENCRYPTED_ANOMALY`
- **Feature Vector (37 Canonical Features):**
  1. *Flow Rates & Volumes (6):* `duration`, `packet_count`, `byte_count`, `packets_per_sec`, `bytes_per_sec`, `bytes_per_packet`.
  2. *TCP/UDP Flags (8):* `is_syn`, `is_ack`, `is_psh`, `is_fin`, `is_rst`, `is_urg`, `is_tcp`, `is_udp`.
  3. *DNS Lexical Metrics (8):* `has_dns`, `dns_query_length`, `dns_entropy`, `dns_vowel_ratio`, `dns_consonant_ratio`, `dns_max_consonant_run`, `dns_ngram_score`, `dns_digit_ratio`.
  4. *TLS/QUIC Metadata (3):* `has_tls`, `has_quic`, `is_ip_sni`.
  5. *Sliding Window Behavioral Features (12):* `src_fan_out`, `unique_dst_hosts`, `unique_dst_ports`, `dst_fan_in`, `flow_rate`, `inter_arrival_time`, `mean_inter_arrival_time`, `inter_arrival_std`, `periodicity_score`, `protocol_tcp_ratio`, `protocol_udp_ratio`, `outbound_inbound_byte_ratio`.
- **Top Feature Importances (from trained `metadata.json`):**
  - `outbound_inbound_byte_ratio`: 13.18% (Critical for Exfiltration)
  - `byte_count`: 10.66%
  - `flow_rate`: 7.40% (Critical for DDoS)
  - `packet_count`: 7.08%
  - `duration`: 5.90%
  - `mean_inter_arrival_time`: 5.16% (Critical for C2 Beaconing)
  - `dns_query_length`: 5.11% (Critical for DNS Tunneling)
- **Inference Speed:** Single-flow inference runs in **1.2 to 2.8 ms** using `n_jobs=1` (avoiding thread-pool contention).
- **Technical Honesty on Score Calibration:** The score returned by Random Forest is the ensemble voting ratio:
  $$\text{score} = \max_{c \in C} \frac{1}{N_{\text{trees}}} \sum_{t=1}^{N_{\text{trees}}} \mathbb{I}(h_t(x) = c)$$
  This is an **uncalibrated voting index**, not an empirical real-world probability. The model output strictly sets `calibrated: false` in accordance with `contracts/ml-prediction-schema.json`.

---

## 5. How Known-Threat Detection and Behavioral Anomaly Detection Work

NETRA AI employs a hybrid detection model: combining **known signature/heuristic rules** for obvious indicators with **stateful sliding-window behavioral detectors** for complex temporal patterns.

### 5.1 The 6 Behavioral Detection Engines

#### 1. Volumetric / Protocol DDoS (`unithreat.detection.ddos.DDoSDetector`)
- **Basis:** Evaluates destination-aggregated traffic over a temporal window.
- **Signals Evaluated:**
  - `flow_rate` and `packet_rate` targeting a single destination IP.
  - `source_ip_entropy`: Computes Shannon entropy across all observed source IPs targeting that destination:
    $$H(\text{src}) = -\sum_{i} p(\text{src}_i) \log_2 p(\text{src}_i)$$
  - `syn_ratio` and `udp_ratio` to identify SYN floods and UDP reflection storms.
- **Thresholds:** Requires $\ge 3$ distinct sources (preventing single-host port scanning from triggering DDoS alarms). Raises `CRITICAL` severity when flow rate $>200$ flows/s or unique sources $>50$.

#### 2. Botnet C2 Beaconing (`unithreat.detection.beacon.C2BeaconDetector`)
- **Basis:** Detects automated command-and-control heartbeats by analyzing connection periodicity between specific host pairs `(src_ip, dst_ip)`.
- **Signals Evaluated:**
  - Extracts inter-arrival times: $\Delta t_i = t_{i+1} - t_i$.
  - Calculates coefficient of variation ($CV$):
    $$CV = \frac{\sigma_{\Delta t}}{\mu_{\Delta t}}$$
  - `periodicity_score` $= \max(0.0, 1.0 - CV)$.
  - Calculates byte-count variance ($CV_{\text{bytes}}$) to confirm identical packet payloads typical of automated keep-alive probes.
- **Thresholds:** Filters out sub-second web asset bursts ($\mu < 1.0$s). Triggers when $CV < 0.25$ and periodicity score $\ge 0.75$.

#### 3. Reconnaissance / Port Scanning (`unithreat.detection.port_scan.PortScanDetector`)
- **Basis:** Tracks source-initiated connection cardinality over time.
- **Signals Evaluated:**
  - **Vertical scanning:** Single source querying multiple destination ports on one host (`port_fan_out` $\ge 8$).
  - **Horizontal scanning:** Single source sweeping the same port across multiple target IPs (`host_sweep` $\ge 12$).
  - Probe duration and packet size (detecting lightweight SYN or FIN probes with durations $<0.5$s and bytes $<120$B).

#### 4. DNS Tunneling & DGA Domains (`unithreat.detection.dns.DNSDetector`)
- **Basis:** Analyzes DNS query metadata without decrypting payloads.
- **DNS Tunneling Path:**
  - Abnormally long queries ($\ge 45$ characters).
  - High Shannon entropy on query labels ($\ge 3.8$ bits/char).
  - High-capacity record types (`TXT`, `NULL`, `CNAME`).
  - Large DNS payload sizes ($\ge 400$ bytes).
- **DGA (Algorithmic Domain Generation) Path:**
  - Calculates vowel-to-consonant ratios ($v_{\text{ratio}} \le 0.15$).
  - Detects abnormally long consecutive consonant runs ($c_{\text{run}} \ge 5$).
  - Bigram frequency scoring against standard English distributions (`_COMMON_ENGLISH_BIGRAMS`).
  - Protects legitimate hyphenated/dictionary domains from false positives.

#### 5. Malware in Encrypted Sessions (`unithreat.detection.encrypted.EncryptedSessionDetector`)
- **Basis:** Inspects TLS and QUIC handshake parameters without payload decryption.
- **Signals Evaluated:**
  - Obsolete SSL/TLS versions (`SSLv2`, `SSLv3`, `TLSv1.0`, `TLSv1.1`).
  - Deprecated QUIC draft versions.
  - Direct IPv4 addresses in Server Name Indication (`is_ip_sni=True`), a primary indicator of hardcoded C2 infrastructure bypassing DNS.
  - Known insecure cipher suites (e.g., RC4, 3DES, EXPORT ciphers).

#### 6. Data Exfiltration (`unithreat.detection.exfiltration.ExfiltrationDetector`)
- **Basis:** Detects abnormal volume transfer and directional asymmetry.
- **Signals Evaluated:**
  - Flow direction (`direction == "outbound"`; inbound file downloads are strictly excluded).
  - Outbound-to-inbound byte ratio:
    $$\text{Ratio} = \frac{\text{Bytes}_{\text{outbound}}}{\text{Bytes}_{\text{inbound}}}$$
  - Sustained transfer duration and transfer rates ($>50$ KB/s sustained).
- **Thresholds:** Requires minimum 100 KB outbound transfer and ratio $\ge 5.0$.

---

## 6. How Our Innovation is Implemented in the Prototype

### Innovation 1: Deterministic 4-Case Evidence Fusion (`AlertFusionEngine`)
Instead of treating machine learning as an infallible black box or relying on single arbitrary thresholds, our `AlertFusionEngine` (`src/unithreat/alerts/fusion.py`) reconciles statistical signals with ML inferences across four deterministic cases:

1. **Case 1: Statistical Detector + ML Agree**
   - Both engines identify the same threat class (e.g., DDoS).
   - Statistical threat class is preserved.
   - Confidence receives a calibrated boost:
     $$\text{Conf}_{\text{final}} = \min\left(1.0, \text{Conf}_{\text{stat}} + (1.0 - \text{Conf}_{\text{stat}}) \times 0.25 \times \text{Score}_{\text{ml}}\right)$$
   - An `EvidenceSignal` with `direction="supporting"`, `reliability=0.85` is attached.
2. **Case 2: Statistical Detector + ML Disagree**
   - Statistical detector triggers, but ML predicts `BENIGN` or a different class.
   - Statistical detection is preserved because it represents an observable physical anomaly.
   - Confidence is dampened: $\text{Conf}_{\text{final}} = \text{Conf}_{\text{stat}} \times 0.85$.
   - An `EvidenceSignal` with `direction="contradicting"`, `reliability=0.50` is attached.
3. **Case 3: Statistical Detection Only**
   - ML inference is unavailable (e.g., model missing or unhandled feature).
   - Preserves statistical results unchanged without hallucinating ML agreement.
4. **Case 4: ML Detection Only (ML Hypothesis)**
   - No statistical threshold triggered, but ML classifier predicts a threat with score $\ge 0.75$.
   - Explicitly flagged as an **ML Hypothesis**:
     $$\text{Conf} = \min(0.75, \text{Score}_{\text{ml}} \times 0.80)$$
   - Severity is capped at `HIGH` (never `CRITICAL`).
   - Attached evidence signal documents that no statistical rule triggered.

### Innovation 2: Group/Run-Aware ML Leakage Prevention (`split_dataset_by_group`)
In network security, naive random row-level train/test splitting leads to catastrophic data leakage because packets from the same attack session share identical IP addresses and timestamps. 

In `src/unithreat/ml/dataset.py`, we implemented multi-run simulation tagging:
- Each simulation run generates an isolated session tagged with a unique `run_id` (e.g., `c2_beacon_run_0`).
- The dataset partitioner assigns **entire runs** exclusively to Train (70%), Validation (15%), or Test (15%).
- Zero flows from an evaluated test run appear in the training partition, guaranteeing honest out-of-session evaluation.

### Innovation 3: Strict Ring-Buffer Memory Boundedness
To guarantee continuous operations without memory leaks:
- `BoundedAlertStore`: Bounded ring buffer (`deque(maxlen=1000)`).
- `BoundedFlowStore`, `BoundedFeatureStore`, `BoundedPredictionStore`: Bounded ring buffers (`deque(maxlen=2000)`).
- `AlertDeduplicator`: LRU-bounded cache capped at 10,000 keys with a 60-second TTL.
- `AlertStreamManager`: Async queues capped at 100 alerts per subscriber with drop-oldest eviction.
- Under benchmark testing with 10,000 continuous mixed flows, peak memory usage leveled out at **~329 MB RSS with zero memory growth**.

---

## 7. How Traffic is Processed and How Alerts are Generated and Displayed

### Step-by-Step Execution Walkthrough

To see how the entire system works in practice, consider what happens when an attacker executes an **Nmap SYN Port Scan**:

1. **Passive Ingestion:** The scanner sends SYN packets across 25 target ports. The passive capture sensor exports a flow JSON record:
   ```json
   {
     "flow_id": "flow-recon-001",
     "timestamp": "2026-09-26T11:15:00.000000Z",
     "src_ip": "192.168.1.105",
     "dst_ip": "10.0.0.50",
     "dst_port": 80,
     "protocol": "TCP",
     "tcp_flags": "SYN",
     "packet_count": 2,
     "byte_count": 120,
     "duration": 0.05
   }
   ```
2. **Schema Validation:** Ingested at `POST /ingest/flow`, parsed and validated by `parse_flow()`. Stored in `BoundedFlowStore`.
3. **Feature Extraction:** `FeatureExtractor.extract()` updates the stateful window tracker for `src_ip=192.168.1.105`. It computes:
   - `is_syn = True`
   - `duration = 0.05`
   - `packets_per_sec = 40.0`
   - `src_fan_out = 25` (probed ports within window)
   - Feature record stored in `BoundedFeatureStore`.
4. **Behavioral Detection:** `PortScanDetector.detect()` queries `window_manager.get_source_history("192.168.1.105")`. It discovers 25 probed ports (`is_vertical=True`) with short durations and low byte counts (`probe_ratio=1.0`). It emits a `DetectionResult`:
   - `threat_class = "RECONNAISSANCE"`
   - `confidence = 0.75`
   - `severity = "HIGH"`
   - `evidence = [port_fan_out=25, reliability=0.92]`
5. **ML Inference:** `MLInferenceEngine.predict()` feeds the 37-feature vector to `RandomForestClassifier`. The model predicts:
   - `threat_class = "RECONNAISSANCE"`
   - `score = 0.94`
   - `calibrated = False`
   - Stored in `BoundedPredictionStore`.
6. **Alert Fusion:** `AlertFusionEngine.fuse()` detects **Case 1 (Agreement)**:
   - Preserves `threat_class = "RECONNAISSANCE"`.
   - Boosts confidence: $0.75 + (1.0 - 0.75) \times 0.25 \times 0.94 = 0.8088$.
   - Appends `EvidenceSignal(signal_name="ml_classifier_support", value=0.94, reliability=0.85)`.
7. **Deduplication:** `AlertDeduplicator.filter()` checks `(192.168.1.105, 10.0.0.50, RECONNAISSANCE)`. Since this is the first occurrence in 60s, it passes.
8. **Storage & Live Broadcast:** Stored in `BoundedAlertStore`. Sent to `AlertStreamManager.broadcast()`, which pushes the alert JSON to active WebSocket subscribers.
9. **SOC Console Update:**
   - The frontend's `WebSocketService` receives the alert payload over `ws://localhost:8000/ws/alerts`.
   - `AlertsPage` prepends the alert to the live table with an animated badge.
   - `OverviewPage` metric counters (`Total Alerts`, `High Severity Alerts`, `Reconnaissance`) increment dynamically.
10. **Analyst Investigation:**
    - An analyst clicks the alert row to open the `AlertDetailDrawer` slide-out, viewing all supporting evidence signals and feature explanations.
    - The analyst clicks **"Investigate Flow"**, navigating to `/flows/flow-recon-001`. The frontend queries `GET /flows/{id}`, `GET /features/{id}`, and `GET /predictions/{id}` to present a 4-panel deep-dive view:
      1. Core Network Tuple
      2. Protocol Metadata
      3. Extracted 37 Network Features
      4. ML Prediction Transparency & Model Details

---

## 8. What We Have Completed, Partially Implemented, and Remaining

To maintain technical honesty, the table below clearly distinguishes what is fully operational versus what is planned for future work:

| Component / Feature | Implementation Status | Technical Details & Repository Grounding |
|---|---|---|
| **Authoritative JSON Schemas** | **COMPLETED** | `contracts/*.json`: Draft 2020-12, strict `additionalProperties: false`. Validated by automated contract tests. |
| **Read-Only Ingestion** | **COMPLETED** | `src/unithreat/ingest/`: JSONL streaming replay and local `/ingest/flow`. Zero active network interaction. |
| **Synthetic Traffic Simulation** | **COMPLETED** | `src/unithreat/generator/`: 8 scenarios (Benign + 7 threats) generating schema-compliant flow sequences. |
| **Streaming Feature Engine** | **COMPLETED** | `src/unithreat/features/`: 37 features, Shannon entropy, DNS lexical metrics, TLS/QUIC metadata, rolling window aggregations. |
| **Statistical Detection Engines** | **COMPLETED** | `src/unithreat/detection/`: All 6 required threat categories implemented with bounded window context. |
| **Tabular ML Classifier** | **COMPLETED** | `src/unithreat/ml/`: `RandomForestClassifier` with median imputer, group-aware split, serialized at `artifacts/models/rf-baseline-v1/`. |
| **Deterministic Alert Fusion** | **COMPLETED** | `src/unithreat/alerts/fusion.py`: 4 explicit cases reconciling statistical and ML signals into explainable alerts. |
| **Bounded In-Memory Stores** | **COMPLETED** | `src/unithreat/alerts/store.py`: Thread-safe deques for alerts (1000), flows (2000), features (2000), predictions (2000). |
| **FastAPI REST API** | **COMPLETED** | `src/unithreat/api/routes.py`: 10 endpoints supporting full forensic querying (`/health`, `/stats`, `/alerts`, `/flows`, `/features`, `/predictions`). |
| **WebSocket Alert Streaming** | **COMPLETED** | `src/unithreat/api/stream.py`: Real-time streaming with bounded client queues and drop-oldest eviction. |
| **React SOC Console** | **COMPLETED** | `frontend/src/`: 9 operational views, dark-first SOC theme, live WebSocket streaming, and forensic investigation views. |
| **Automated Test Suites** | **COMPLETED** | 310 backend tests (`pytest`) + 125 frontend tests (`vitest`) passing with 100% success rate. |
| **Performance Benchmarking** | **COMPLETED** | Verified throughput: **131.7 flows/sec**, mean latency **7.59 ms** on 10,000 continuous mixed flows (`benchmark_10000.json`). |
| **Lab Traffic Validation** | **COMPLETED** | Verified across 8 lab scenarios (live socket sessions + modeled tool replays): **100% detection rate, 0 misses, 0 false positives**. |
| **NetFlow / IPFIX / sFlow Ingest** | **PARTIALLY IMPLEMENTED** | Flow fields match NetFlow v9/IPFIX standards. However, binary UDP NetFlow collectors are not yet implemented (flows enter as normalized JSONL). |
| **JA3 / JA4 Fingerprinting** | **PARTIALLY IMPLEMENTED** | Schema fields and detectors evaluate `tls_ja3` when provided. However, direct raw byte-level MD5 hashing is simulated/pre-extracted by the flow source. |
| **Model Score Calibration** | **PARTIALLY IMPLEMENTED** | Model outputs uncalibrated tree voting scores (`calibrated: false`). Platt scaling or Isotonic regression is architecturally prepared for future training. |
| **Live Raw PCAP / TAP Capture** | **REMAINING / FUTURE** | Requires root-level libpcap / AF_PACKET / DPDK sockets to sniff live physical network data diodes. |
| **Novel / Zero-Day Anomaly Detection** | **REMAINING / FUTURE** | Unsupervised anomaly models (e.g., Isolation Forest, Autoencoders) planned for Phase 8. |
| **Persistent External Database** | **REMAINING / FUTURE** | Currently runs on high-speed in-memory ring buffers. Long-term PostgreSQL / Supabase persistence is architecturally decoupled. |

---

## 9. How to Run the Prototype and Demonstrate Its Functionality

Follow these steps to run the complete prototype on a local machine.

### Step 1: Environment Setup

```bash
# 1. Clone / Navigate to project repository
cd /home/ayush/sihproject/unithreat-ai

# 2. Activate Python Virtual Environment
source .venv/bin/activate

# 3. Verify Python Dependencies
python -m pip install -e .

# 4. Verify Frontend Dependencies
cd frontend
npm install
cd ..
```

---

### Step 2: Run Verification Test Suites

```bash
# 1. Run Backend Test Suite (310 Pytest Tests)
.venv/bin/python -m pytest tests/ -q
# Expected output: 310 passed in ~4.3s

# 2. Run Frontend Test Suite (125 Vitest Tests)
cd frontend
npm test
# Expected output: 125 passed across 9 test files
cd ..
```

---

### Step 3: Launch the Prototype Services

Open two separate terminal windows:

#### Terminal 1 — Start the FastAPI Backend Server
```bash
cd /home/ayush/sihproject/unithreat-ai
source .venv/bin/activate
.venv/bin/uvicorn unithreat.api.app:create_app --factory --host 127.0.0.1 --port 8000
```
*Backend will be accessible at `http://127.0.0.1:8000` (Swagger docs at `/docs`).*

#### Terminal 2 — Start the React SOC Dashboard
```bash
cd /home/ayush/sihproject/unithreat-ai/frontend
npm run dev
```
*Frontend will be accessible at `http://localhost:5173`.*

---

### Step 4: Run the Live Multi-Threat Demonstration Script

With both the backend and frontend running, open a third terminal to simulate live network traffic:

```bash
cd /home/ayush/sihproject/unithreat-ai
source .venv/bin/activate
python scripts/replay_multi_threats.py
```

#### What this script demonstrates:
1. Connects to `ws://127.0.0.1:8000/ws/alerts` and prints live alert notifications in the terminal.
2. Sequentially streams traffic for **6 distinct scenarios**:
   - **Benign Traffic (8 flows):** Verified 0 alerts generated (zero false positives).
   - **Reconnaissance / Port Scan (25 flows):** Vertical SYN port sweep; triggers `RECONNAISSANCE` alert (~0.75 confidence).
   - **Botnet C2 Beaconing (20 flows):** Periodic 30s jittered beacons; triggers `C2_BEACONING` alerts (~0.76 confidence).
   - **DGA Domain Generation (15 flows):** Pseudo-random high-entropy DNS queries; triggers `DGA` alerts.
   - **Encrypted Session Anomaly (15 flows):** Obsolete SSLv3/RC4 ciphers & direct-IP SNI; triggers `ENCRYPTED_ANOMALY` alerts.
   - **DNS Tunneling (15 flows):** Base32/Hex encapsulated payloads; triggers `DNS_TUNNELING` alerts (~0.98 confidence).
3. **What to observe on the React SOC Console (`http://localhost:5173`):**
   - **Top Header:** Confirms `LIVE BACKEND — REALTIME DETECTION` with a green pulse indicator.
   - **Overview Page:** The `Total Alerts`, `Critical`, and `High` counters update automatically without refreshing the browser.
   - **Live Alerts Page:** Threat alert cards stream into the table in real time.
   - **Drill-Down Drawer:** Click any alert row to view the explainability signals, supporting features, and model version.
   - **Flow Investigation Page:** Click **"Inspect Flow"** to view the full 4-panel forensic breakdown for that exact packet flow.

---

### Step 5: Run Automated Performance Benchmarking

To measure throughput, latency, and memory boundedness on your hardware:

```bash
python scripts/benchmark_pipeline.py --flows 1000 5000 10000 --scenario mixed --seed 42
```
*Outputs detailed metrics to stdout and saves a JSON report in `artifacts/benchmarks/`.*

---

### Step 6: Run Isolated Lab Traffic Validation

To evaluate the pipeline against isolated loopback TCP/UDP socket activity and modeled threat signatures:

```bash
python scripts/validate_lab_traffic.py --scenario all
```
*Evaluates all 8 scenarios and outputs validation results to `artifacts/validation/`.*

---

## 10. Key File Index & Responsibilities

| File Path | Primary Class / Function | Responsibility |
|---|---|---|
| `contracts/alert-schema.json` | JSON Schema Draft 2020-12 | Authoritative contract defining standard threat alert structure. |
| `src/unithreat/alerts/pipeline.py` | `IntegratedPipeline` | Coordinates Flow -> Features -> Detectors -> ML -> Fusion -> Deduplication -> Stores -> Stream. |
| `src/unithreat/alerts/fusion.py` | `AlertFusionEngine` | Deterministically fuses statistical detections and ML predictions across 4 explicit cases. |
| `src/unithreat/alerts/dedup.py` | `AlertDeduplicator` | 60-second sliding-window alert deduplication using an LRU cache. |
| `src/unithreat/alerts/store.py` | `BoundedAlertStore`, `BoundedFlowStore`, `BoundedFeatureStore`, `BoundedPredictionStore` | Thread-safe in-memory ring buffers guaranteeing bounded memory usage. |
| `src/unithreat/features/extractor.py` | `FeatureExtractor` | Calculates 37 features, Shannon entropy, DNS lexical metrics, and TLS/QUIC parameters. |
| `src/unithreat/features/window.py` | `FeatureWindowTracker` | Maintains sliding-window temporal entity statistics (fan-out, inter-arrival time, flow rate). |
| `src/unithreat/detection/engine.py` | `DetectionEngine` | Orchestrates the 6 statistical and behavioral detection engines. |
| `src/unithreat/detection/ddos.py` | `DDoSDetector` | Volumetric and protocol DDoS detection using rate and source entropy. |
| `src/unithreat/detection/beacon.py` | `C2BeaconDetector` | C2 beaconing detection using inter-arrival coefficient of variation. |
| `src/unithreat/detection/port_scan.py`| `PortScanDetector` | Reconnaissance detection using vertical and horizontal fan-out. |
| `src/unithreat/detection/dns.py` | `DNSDetector` | DNS tunneling and DGA domain detection using query length and entropy. |
| `src/unithreat/detection/encrypted.py`| `EncryptedSessionDetector` | Passive encrypted anomaly detection using TLS/QUIC handshake metadata. |
| `src/unithreat/detection/exfiltration.py`| `ExfiltrationDetector` | Data exfiltration detection using outbound volume and directional byte ratio asymmetry. |
| `src/unithreat/ml/pipeline.py` | `create_model_pipeline`, `save_pipeline`, `load_pipeline` | Scikit-learn Pipeline combining `SimpleImputer` and `RandomForestClassifier`. |
| `src/unithreat/ml/inference.py` | `MLInferenceEngine` | Low-latency single-flow inference producing contract-compliant predictions. |
| `src/unithreat/ml/dataset.py` | `split_dataset_by_group` | Prevents data leakage by partitioning dataset strictly by simulation run ID. |
| `src/unithreat/api/app.py` | `create_app` | FastAPI application factory configuring CORS, routing, and lifecycle events. |
| `src/unithreat/api/routes.py` | `create_router` | Implements the 10 REST and WebSocket API endpoints. |
| `src/unithreat/api/stream.py` | `AlertStreamManager` | Manages WebSocket subscribers with bounded queues and drop-oldest eviction. |
| `frontend/src/services/HttpDataService.ts` | `HttpDataService` | Frontend REST client querying backend endpoints without inventing intelligence. |
| `frontend/src/services/WebSocketService.ts` | `WebSocketService` | Resilient WebSocket client with exponential backoff and real-time alert buffering. |
| `frontend/src/pages/AlertsPage.tsx` | `AlertsPage` | Real-time threat alert feed with filters and drill-down drawer. |
| `frontend/src/pages/FlowInvestigationPage.tsx` | `FlowInvestigationPage` | 4-panel forensic drill-down for deep flow inspection. |
| `frontend/src/pages/MlIntelligencePage.tsx` | `MlIntelligencePage` | ML transparency view presenting model metrics, feature importances, and score caveats. |
| `scripts/replay_multi_threats.py` | `main` | Demonstration script replaying 6 diverse threat scenarios with live WebSocket feedback. |
| `scripts/benchmark_pipeline.py` | `main` | Performance benchmarking script measuring throughput, latency, and memory RSS. |
| `scripts/validate_lab_traffic.py` | `main` | Validation runner verifying detection accuracy across isolated lab sockets and replayed attacks. |

---

## 11. Conclusion & Next Steps for Resuming AI Assistants

NETRA AI is currently at a mature prototype stage:
- The detection core is mathematically grounded, tested, and high-performing (~131.7 flows/sec, ~7.6 ms latency).
- The passive unidirectional boundary is strictly maintained (zero active network probes, zero payload decryption).
- The live backend and React frontend are fully integrated over REST and WebSockets.
- All 310 backend tests and 125 frontend tests pass cleanly with zero errors.

### Immediate Next Tasks (Phase 7):
1. **Analyst Workflow Refinements:** Enhance interactive drill-downs and investigative filtering on the SOC console.
2. **SOC Visual Hierarchy:** Polish dark SOC visual consistency, card contrast, and table density in accordance with the design system.
3. **Comprehensive Demonstration Package:** Prepare standalone demo recordings and reproducible walk-throughs for hackathon evaluators.
