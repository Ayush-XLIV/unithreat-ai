# Development Execution Plan

## 1. Purpose

This document defines the execution blueprint for building the SIH Problem Statement 26145 prototype as quickly as possible using parallel AI-assisted development.

This is **not a calendar-based development plan**.

The project should be developed as independent workstreams that can proceed simultaneously wherever their contracts permit. Integration, testing, and demo hardening remain mandatory and must not be skipped.

The source of truth for requirements is:

```text
docs/official-problem-statement.md
```

The global engineering rules are defined in:

```text
AGENTS.md
```

The architectural design is defined in:

```text
docs/architecture.md
```

The detection methodology is defined in:

```text
docs/detection-methodology.md
```

---

## 2. Execution Principle

The team should optimize for:

```text
Parallel development
        +
Explicit contracts
        +
Frequent integration
        +
Automated testing
        =
Fast working prototype
```

AI agents should not wait for an entire subsystem to be completed if the required interface is already defined.

However, parallel development must not become uncontrolled development. Agents must work inside explicit boundaries and must not independently redefine the architecture, schemas, detection methodology, or technology stack.

---

## 3. Target Prototype

The final prototype must demonstrate this complete path:

```text
PCAP / Passive Traffic
        |
        v
Metadata Extraction
        |
        v
Feature Engineering
        |
        v
Behavioral Context
        |
        +----------------------+
        |                      |
        v                      v
Statistical Signals       ML Inference
        |                      |
        +----------+-----------+
                   |
                   v
             Evidence Fusion
                   |
                   v
            Threat Hypothesis
                   |
                   v
             Alert Record
                   |
             +-----+-----+
             |           |
             v           v
            API       Persistence
             |           |
             +-----+-----+
                   |
                   v
               Dashboard
```

The prototype is not considered complete if only individual components work in isolation.

---

## 4. Parallel Workstreams

The following workstreams should be developed concurrently.

### Workstream A — Ingestion and Metadata

Responsibility:

```text
PCAP / passive input
        ↓
traffic metadata
```

Primary tasks:

- PCAP ingestion
- streaming/replay support
- Zeek integration
- flow metadata extraction
- DNS metadata extraction
- TLS/QUIC metadata extraction where available
- normalized internal metadata representation

Must not:

- send packets back to the observed network
- probe hosts
- complete handshakes
- decrypt payloads
- introduce active scanning

Output contract:

```text
Normalized passive metadata events
```

---

### Workstream B — Common Feature Engine

Responsibility:

```text
metadata
    ↓
reusable numerical/contextual features
```

Primary tasks:

- flow features
- temporal features
- behavioral features
- DNS lexical features
- TLS/QUIC metadata features
- bounded-window aggregation
- feature normalization where required

Must not:

- embed final threat decisions inside generic feature extraction
- hard-code arbitrary threat labels into reusable features
- use raw identifiers as model features without justification

Output contract:

```text
Feature records associated with event/flow context
```

---

### Workstream C — Behavioral Context

Responsibility:

```text
features
    ↓
host/session/destination behavioral state
```

Primary tasks:

- bounded state
- sliding or tumbling windows
- host activity summaries
- destination repetition
- fan-out tracking
- temporal patterns
- baseline statistics
- state expiration

Must not:

- grow memory without bounds
- require a database for every real-time state update
- make active network queries

Output contract:

```text
Behavioral context + derived behavioral features
```

---

### Workstream D — Threat Detection

Responsibility:

```text
behavioral/features
        ↓
threat-specific evidence signals
```

Threat coverage:

1. DDoS
2. C2 beaconing
3. DGA
4. DNS tunnelling
5. Encrypted-session suspicious behavior
6. Reconnaissance
7. Data exfiltration

Note: the official problem statement specifies six named threat categories, with DDoS containing multiple subtypes. The implementation must preserve that terminology.

Primary tasks:

- threat-specific feature selection
- statistical signals
- threat hypothesis logic
- false-positive controls
- evidence generation

Output contract:

```text
EvidenceSignal[]
```

The detector must not invent unsupported claims such as confirmed malware or confirmed data theft.

---

### Workstream E — Machine Learning

Responsibility:

```text
engineered features
        ↓
trained model
        ↓
prediction/evidence
```

Primary tasks:

- dataset preparation
- leakage-aware splits
- baseline model
- threat classification
- model serialization
- inference API/module
- evaluation metrics
- probability calibration if required

Initial model candidates:

- Logistic Regression
- Random Forest
- Gradient Boosting

The simplest model that produces credible validation results should be preferred.

Must not:

- fabricate accuracy
- train on test data
- use attack labels that leak directly into input features
- claim ML capability without measured results

Output contract:

```text
MLPrediction
    class
    score/probability
    model_version
```

---

## 5. Alert and Evidence Layer

Responsibility:

```text
Evidence signals + ML predictions
             ↓
        Evidence Fusion
             ↓
        Confidence/Severity
             ↓
            Alert
```

Primary tasks:

- evidence normalization
- fusion implementation
- confidence calculation
- severity calculation
- explanation generation
- standardized alert schema

The exact fusion equation must be selected experimentally and documented.

No arbitrary weights should be introduced merely for presentation.

Output must satisfy the standardized alert requirements:

```text
timestamp
flow/event identifier
threat class
confidence
supporting evidence
```

Recommended additional fields:

```text
severity
source/destination metadata
protocol
detection stage
model version
evidence signals
feature snapshot
explanation
```

---

## 6. Backend and Persistence

Responsibility:

```text
alerts
   ↓
API
   ↓
database
```

Preferred prototype stack:

- FastAPI
- Supabase/PostgreSQL

The database is for persistence, history, dashboard queries, and forensic records. It should not be placed unnecessarily inside the critical real-time detection path.

Primary tasks:

- alert ingestion endpoint
- alert retrieval
- filtering
- threat summaries
- historical detections
- database schema
- health endpoint

The backend must accept the standardized alert contract rather than inventing a second incompatible representation.

---

## 7. Dashboard

Responsibility:

```text
API
 ↓
analyst-facing visualization
```

Preferred stack:

- React
- Vite

Minimum dashboard capabilities:

- total alerts
- alerts by threat type
- severity distribution
- confidence
- recent alert feed
- source/destination context
- evidence details
- timestamp
- filtering
- detection explanation

The dashboard should make the system's reasoning visible.

A dashboard that only displays:

```text
DDoS detected
```

is insufficient.

It should show why the system reached that conclusion.

---

## 8. Contracts First

Parallel agents require stable interfaces.

The project should establish contracts for:

```text
metadata
features
ML predictions
evidence signals
alerts
```

Recommended repository structure:

```text
contracts/
├── flow-schema.json
├── feature-schema.json
└── alert-schema.json
```

Additional schemas should only be added when needed.

Agents may implement against these contracts without waiting for the full implementation of another subsystem.

---

## 9. Dependency Graph

The major dependency relationships are:

```text
Official PS
    |
    v
Architecture + Methodology
    |
    +-------------------------------+
    |               |               |
    v               v               v
 Ingest         Features           ML
    |               |               |
    +-------+-------+               |
            |                       |
            v                       |
     Behavioral Context             |
            |                       |
            +-----------+-----------+
                        |
                        v
                 Threat Detection
                        |
                        v
                 Evidence Fusion
                        |
                        v
                     Alerts
                        |
                  +-----+-----+
                  |           |
                  v           v
                 API       Database
                  |
                  v
              Dashboard
```

Where possible, agents should work from contracts instead of waiting for implementation dependencies.

---

## 10. Integration Strategy

Integration should happen continuously.

Every completed workstream should provide:

1. Code
2. Tests
3. Contract compliance
4. Short usage instructions
5. Known limitations

The integration owner should regularly verify:

```text
ingest → feature → detection → ML → alert
```

and separately:

```text
alert → API → database → dashboard
```

Then verify the complete path:

```text
PCAP → dashboard
```

---

## 11. First End-to-End Slice

Before polishing all threat categories, the fastest proof of architecture is one complete DDoS path:

```text
PCAP
 ↓
Zeek metadata
 ↓
flow features
 ↓
DDoS evidence
 ↓
ML prediction
 ↓
evidence fusion
 ↓
alert JSON
 ↓
FastAPI
 ↓
database
 ↓
dashboard
```

This is not a calendar milestone.

It is the first integration target that allows every parallel workstream to validate its interfaces.

Once this path works, the remaining threat detectors can plug into the same framework.

---

## 12. Definition of Done for a Workstream

A workstream is not complete merely because code exists.

It is complete when:

- implementation runs
- tests pass
- inputs/outputs match the contract
- errors are handled
- no architectural constraints are violated
- another developer/agent can integrate it
- limitations are documented

---

## 13. Definition of Done for the Prototype

The prototype is complete only when it can demonstrate:

### Architecture

- strictly passive/read-only ingestion
- no return path
- no probing
- no active mitigation
- no payload decryption

### Detection

- DDoS
- C2 beaconing
- DGA
- DNS tunnelling
- suspicious encrypted-session behavior
- reconnaissance
- data exfiltration

### Intelligence

- behavioral context
- statistical evidence
- genuine ML inference
- evidence fusion
- confidence
- severity
- explainable evidence

### Product

- streaming or replayed detection
- API
- persistence
- dashboard
- standardized alerts

### Engineering

- automated tests
- reproducible setup
- documented dataset
- leakage-aware validation
- measured throughput
- measured detection latency

---

## 14. Scope-Cut Rules

If implementation time becomes constrained, remove complexity in this order:

### Cut first

- fancy dashboard animations
- advanced frontend interactions
- optional anomaly/novelty detector
- unnecessary distributed infrastructure
- blockchain integration unless independently justified
- deep-learning experiments

### Preserve

- passive ingest
- feature engine
- behavioral context
- genuine ML
- all six required threat categories
- evidence fusion
- alert schema
- dashboard
- measured performance

Do not sacrifice the core detection pipeline for presentation features.

---

## 15. AI Agent Operating Rules

AI coding agents should:

1. Read `AGENTS.md` before modifying code.
2. Read the relevant architecture and methodology sections.
3. Identify their assigned workstream.
4. Read the applicable contract.
5. Implement only within their assigned boundary.
6. Add tests.
7. Run relevant tests before reporting completion.
8. Document assumptions.
9. Avoid changing unrelated files.
10. Never silently redefine architecture or detection methodology.

If an agent believes a requirement or design is wrong, it should report the conflict rather than silently changing it.

---

## 16. Parallel Agent Assignment

A practical parallel setup is:

```text
Agent 1 — Ingestion
Agent 2 — Feature Engineering
Agent 3 — Behavioral + Threat Detection
Agent 4 — ML Pipeline
Agent 5 — Backend + Database
Agent 6 — Dashboard
Agent 7 — Integration / Testing / Contracts
```

These agents should not operate as isolated projects.

They are components of one system and must use shared contracts.

The integration/testing agent has authority to reject outputs that break contracts or violate architectural constraints.

---

## 17. Coordination Protocol

Each agent should report:

```text
STATUS
- completed

FILES
- changed files

CONTRACT
- input contract used
- output contract produced

TESTS
- tests added
- tests passed

ASSUMPTIONS
- assumptions made

BLOCKERS
- unresolved issues

INTEGRATION
- how another component should consume the output
```

This keeps AI-generated work auditable and prevents duplicate implementation.

---

## 18. No Fake Parallelism

Parallelism does not mean every agent builds a complete application independently.

Avoid:

```text
Agent A builds its own alert format
Agent B builds another alert format
Agent C builds another feature representation
Agent D builds another API
```

Instead:

```text
Shared Contract
      ↓
Multiple implementations
      ↓
Integration
```

One canonical schema must exist for each shared interface.

---

## 19. Performance Work

Performance must be measured after the pipeline is functional.

Measure at least:

- flows/sec
- Mbps where measurable
- detection latency
- processing latency
- memory usage

The project must report the actual tested rate.

Do not write a target such as:

```text
10,000 flows/sec
```

until it has been measured.

---

## 20. Demo Path

The final demonstration should be deterministic and reproducible.

Recommended sequence:

```text
1. Start system
2. Load/replay controlled PCAP
3. Show passive metadata processing
4. Show feature/behavior processing
5. Show ML + evidence fusion
6. Show generated alert
7. Show evidence behind alert
8. Show dashboard
9. Show multiple threat classes
10. Show measured throughput/latency
```

The demo must make the unidirectional/read-only constraint visible.

---

## 21. Research and Documentation Discipline

Every major technical decision should have one of:

- implementation evidence
- experiment result
- authoritative documentation
- explicit engineering rationale

Do not add technologies, models, or “innovations” solely because they sound impressive.

The prototype should prioritize:

```text
Correctness
> Reproducibility
> Demonstrable detection
> Explainability
> Performance
> Presentation polish
```

---

## 22. Final Execution Rule

The objective is not to produce the largest codebase.

The objective is to produce the smallest **credible, working, measurable, explainable** prototype that satisfies the official problem statement.

AI should accelerate implementation.

It must not be allowed to invent requirements, architecture, detection logic, performance claims, or security claims.
