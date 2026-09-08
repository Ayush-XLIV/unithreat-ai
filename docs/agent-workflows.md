# Agent Workflows

## 1. Purpose

This document defines the responsibilities, boundaries, contracts, testing expectations, and integration rules for AI coding agents working on the SIH Problem Statement 26145 prototype.

The purpose is to enable aggressive parallel development without allowing agents to independently redesign the system.

All agents must follow:

```text
AGENTS.md
docs/official-problem-statement.md
docs/architecture.md
docs/detection-methodology.md
docs/development-plan.md
```

The official problem statement is the source of truth for requirements.

---

## 2. Core Rule: Shared System, Separate Ownership

Agents are building one system.

They are not building independent applications.

The architecture is:

```text
Passive Input
     |
     v
Ingestion
     |
     v
Metadata
     |
     v
Feature Engine
     |
     v
Behavioral Context
     |
     +-------------------+
     |                   |
     v                   v
Threat Evidence         ML
     |                   |
     +---------+---------+
               |
               v
        Evidence Fusion
               |
               v
             Alert
               |
          +----+----+
          |         |
          v         v
         API      Database
          |
          v
      Dashboard
```

An agent must not silently replace a component, schema, framework, or methodology owned by another agent.

If a change outside its ownership is necessary, the agent must report it first.

---

# 3. Agent Ownership Model

| Agent | Primary ownership | Main output |
|---|---|---|
| Agent 1 | Ingestion | Passive metadata |
| Agent 2 | Feature Engineering | Feature records |
| Agent 3 | Behavioral + Threat Detection | Evidence signals |
| Agent 4 | Machine Learning | ML predictions/models |
| Agent 5 | Evidence Fusion + Alerts | Standardized alerts |
| Agent 6 | Backend + Persistence | API/database |
| Agent 7 | Dashboard | Analyst UI |
| Agent 8 | Integration + Testing | Integrated, validated system |

Agents 1–7 build components in parallel.

Agent 8 continuously validates integration and contracts.

---

# 4. Shared Contract Rule

The following interfaces are shared:

```text
Passive Metadata
      ↓
Feature Record
      ↓
ML Prediction
      ↓
Evidence Signal
      ↓
Alert
```

Recommended shared contracts:

```text
contracts/
├── flow-schema.json
├── feature-schema.json
├── evidence-schema.json
├── ml-prediction-schema.json
└── alert-schema.json
```

The API response contract should be derived from the canonical alert contract rather than becoming a competing representation.

Additional contracts should be created only when an actual integration problem requires them.

### Contract rule

Once a contract is being consumed by another agent:

- do not rename fields casually
- do not change field types casually
- do not remove fields without checking consumers
- do not introduce incompatible versions silently

If a contract must change, update the contract first and notify dependent agents.

---

# 5. Agent 1 — Ingestion Agent

## Mission

Build the strictly passive traffic ingestion and metadata extraction layer.

## Owns

```text
src/ingest/
src/metadata/
tests/ingest/
tests/metadata/
```

It may add small shared utilities only when clearly related to ingestion.

## Responsibilities

- PCAP input
- PCAP replay/streaming
- Zeek integration
- flow metadata extraction
- DNS metadata extraction
- TLS metadata extraction
- QUIC metadata extraction where available
- normalization into the project's internal metadata representation
- malformed-input handling
- replay timing support

## Must never

- send packets
- probe hosts
- initiate connections
- complete handshakes
- decrypt payloads
- perform active scanning
- implement mitigation

## Input

```text
PCAP / passive traffic source
```

## Output

```text
Normalized passive metadata events
```

## Required tests

- valid PCAP
- empty PCAP
- malformed input
- multiple protocols
- timestamp handling
- metadata normalization
- no active network behavior

## Definition of done

Another agent can consume normalized metadata without knowing Zeek's raw output format.

---

# 6. Agent 2 — Feature Engineering Agent

## Mission

Convert normalized passive metadata into reusable model/detection features.

## Owns

```text
src/features/
tests/features/
```

## Responsibilities

Implement:

- flow features
- rate features
- temporal features
- entropy features
- destination/source diversity
- fan-out
- port diversity
- burstiness
- DNS lexical features
- DNS behavioral features
- TLS/QUIC metadata features
- outbound/inbound ratios
- bounded-window aggregation

## Design rule

The feature engine measures behavior.

It must not become a hidden rule engine.

For example:

```text
domain_entropy = 4.8
```

is a feature.

This belongs in the feature engine.

```text
if domain_entropy > X:
    DGA
```

does not belong in generic feature extraction.

## Must consider

- missing values
- zero-duration flows
- division by zero
- numeric stability
- bounded memory
- consistent feature names
- deterministic calculations

## Input

```text
Normalized metadata
+
bounded behavioral context where required
```

## Output

```text
Feature record
```

## Required tests

- known feature calculations
- edge cases
- zero values
- missing metadata
- deterministic output
- schema compliance

## Definition of done

Detection and ML agents can consume feature records without implementing their own duplicate feature calculations.

---

# 7. Agent 3 — Behavioral + Threat Detection Agent

## Mission

Build behavioral state and threat-specific evidence generation.

## Owns

```text
src/behavioral/
src/detection/
tests/behavioral/
tests/detection/
```

## Responsibilities

Implement:

- bounded behavioral state
- sliding/tumbling windows
- host behavior
- destination repetition
- fan-out
- temporal behavior
- baselines where practical
- threat-specific evidence signals

Threat coverage:

```text
Volumetric / protocol DDoS
Botnet C2 beaconing
DGA domains + DNS tunnelling
Malware-related suspicious encrypted sessions
Reconnaissance / port scanning
Data exfiltration
```

## Output

Normalized evidence signals such as:

```text
high_packet_rate
strong_source_entropy
strong_periodicity
high_port_fanout
high_domain_entropy
long_dns_queries
suspicious_tls_pattern
high_outbound_ratio
```

## Important rule

The detector should produce evidence and threat hypotheses.

It must not pretend that a single signal proves compromise.

Examples:

- high entropy does not automatically prove DGA
- periodicity does not automatically prove C2
- high volume does not automatically prove DDoS
- a TLS fingerprint does not prove malware
- large outbound traffic does not prove exfiltration

## Required tests

Each mandatory threat category needs at least:

- representative positive scenario
- representative benign scenario
- feature/evidence assertions
- boundary/edge case

## Definition of done

The detection layer can process a feature/context stream and produce explainable evidence signals without depending on the dashboard or database.

---

# 8. Agent 4 — Machine Learning Agent

## Mission

Build a genuine, reproducible ML training and inference pipeline.

## Owns

```text
src/ml/
training/
models/
tests/ml/
```

## Responsibilities

- dataset preparation
- feature/label extraction
- leakage-aware splitting
- baseline training
- model comparison where useful
- evaluation
- model serialization
- inference
- model versioning
- probability calibration if required

## Initial model candidates

Start with practical tabular models:

```text
Logistic Regression
Random Forest
Gradient Boosting
```

Do not introduce deep learning unless experiments justify it.

## Critical rule

No fabricated metrics.

Every reported metric must come from an actual reproducible experiment.

## Leakage prevention

Do not randomly split highly related flows from the same capture into train and test if that creates an unrealistic evaluation.

Prefer separation by:

- capture
- attack run
- scenario
- time period
- host environment

where practical.

## Input

```text
Feature records
+
training labels
```

## Output

```text
MLPrediction
    threat_class
    score/probability
    model_version
```

## Required tests

- feature loading
- training reproducibility
- model loading
- inference
- schema compliance
- missing/invalid feature handling

## Definition of done

A saved model can be loaded independently and produce predictions from the standardized feature representation.

---

# 9. Agent 5 — Evidence Fusion + Alert Agent

## Mission

Combine independent evidence and ML predictions into standardized explainable alerts.

## Owns

```text
src/fusion/
src/alerts/
tests/fusion/
tests/alerts/
```

## Responsibilities

- evidence normalization
- ML evidence integration
- evidence fusion
- threat hypothesis
- confidence
- severity
- explanation
- alert construction
- alert validation

## Input

```text
EvidenceSignal[]
+
MLPrediction
```

## Output

```text
Alert
```

Minimum alert fields:

```text
timestamp
flow/event identifier
threat class
confidence
supporting evidence
```

Recommended:

```text
severity
source/destination
protocol
model version
evidence signals
feature snapshot
explanation
```

## Critical rule

Do not hard-code arbitrary weights merely to produce impressive scores.

The fusion method must be documented and justified through experiments.

Confidence must not be presented as a real-world probability unless calibration supports that interpretation.

## Required tests

- evidence-only case
- ML-only case
- combined evidence case
- conflicting evidence
- low-confidence case
- invalid signal handling
- schema validation

## Definition of done

The system can transform detection evidence and ML predictions into a valid, explainable alert independently of the UI.

---

# 10. Agent 6 — Backend + Persistence Agent

## Mission

Expose detection results through a reliable API and persist alert history.

## Owns

```text
src/api/
src/db/
tests/api/
tests/db/
```

## Preferred stack

```text
FastAPI
Supabase/PostgreSQL
```

Supabase is PostgreSQL-backed and is acceptable for the prototype.

## Responsibilities

- API application
- alert ingestion
- alert retrieval
- filtering
- summaries
- health endpoint
- database schema
- database access
- validation
- error handling

## Must not

- duplicate detection logic
- modify ML decisions
- silently alter confidence
- create a second alert schema

The API consumes the canonical alert contract.

## Definition of done

A generated alert can be submitted, persisted, retrieved, filtered, and served to the dashboard.

---

# 11. Agent 7 — Dashboard Agent

## Mission

Build the analyst-facing visualization.

## Owns

```text
frontend/
tests/frontend/
```

## Preferred stack

```text
React
Vite
```

## Responsibilities

Minimum views:

- alert count
- threat distribution
- severity distribution
- confidence
- recent alerts
- alert details
- evidence
- source/destination
- timestamp
- filtering
- explanation

## Design rule

The dashboard must visualize the system's reasoning.

A screen that only says:

```text
DDoS detected
```

is insufficient.

The analyst should be able to see:

```text
Threat
Confidence
Severity
Evidence
Relevant traffic context
```

## Input

Canonical API responses.

## Definition of done

The dashboard can display real persisted alerts from the backend.

Mock data may be used during parallel development, but the final integration must use the real API.

---

# 12. Agent 8 — Integration + Testing Agent

## Mission

Protect system integrity and continuously prove that components work together.

## Owns

```text
tests/integration/
tests/e2e/
scripts/
```

It may modify other components only to fix verified integration defects, and should coordinate such changes with the owning agent.

## Responsibilities

- contract validation
- integration tests
- end-to-end tests
- startup checks
- pipeline smoke tests
- performance measurement
- regression testing
- Docker/Compose validation
- demo-path validation

## Primary test path

```text
PCAP
 ↓
metadata
 ↓
features
 ↓
behavior
 ↓
detection
 ↓
ML
 ↓
fusion
 ↓
alert
 ↓
API
 ↓
database
 ↓
dashboard
```

## Definition of done

A clean environment can reproduce the complete demonstration path.

---

# 13. What Agents May Share

Agents may share:

- contracts
- test fixtures
- documented utility functions
- sample data
- configuration conventions

But shared code should have a clear owner.

Do not create duplicate versions of the same utility in multiple directories.

---

# 14. What Agents Must Not Do

No agent may:

- rewrite `AGENTS.md` to make its task easier
- alter the official problem statement
- silently change the architecture
- silently replace the selected stack
- invent performance numbers
- invent ML metrics
- claim unvalidated detection capability
- add active network communication
- decrypt traffic
- add unnecessary infrastructure
- introduce blockchain solely because the SIH theme mentions it
- add deep learning solely for presentation
- create fake ML that is only threshold rules
- add unrelated features outside the project scope

---

# 15. Handling Design Conflicts

If two agents disagree:

```text
Agent A
   |
   v
documents conflict
   |
   v
check AGENTS.md
   |
   v
check architecture.md
   |
   v
check detection-methodology.md
   |
   v
choose smallest compliant solution
```

If the conflict cannot be resolved from those documents, stop the conflicting change and escalate to the project owner rather than silently deciding.

---

# 16. Agent Handoff Format

Every agent should finish a task with:

```text
STATUS: COMPLETE / BLOCKED

MISSION:
<what was implemented>

FILES CHANGED:
<files>

CONTRACTS:
<input>
<output>

TESTS:
<tests added>
<tests executed>
<result>

INTEGRATION:
<how another agent consumes this>

ASSUMPTIONS:
<assumptions>

KNOWN LIMITATIONS:
<limitations>

BLOCKERS:
<if any>
```

This format makes AI-generated work auditable.

---

# 17. Parallel Execution Rules

The agents should start concurrently wherever possible.

### Can begin independently

```text
Ingestion
Feature Engineering
ML
Backend
Dashboard
Integration scaffolding
```

### Requires conceptual contracts

```text
Behavioral/Detection → feature contract
ML → feature contract
Fusion/Alerts → evidence + ML contracts
Backend → alert contract
Dashboard → API/alert contract
```

Agents can use stable mock fixtures against these contracts while upstream implementations are still being developed.

The ML agent may begin with fixture-generated feature records and a provisional training dataset, but the final model must be retrained and evaluated against the canonical feature representation before integration is considered complete.

---

# 18. Integration Checkpoints

Integration should happen whenever a contract-producing component becomes usable.

Examples:

```text
Metadata contract
      ↓
Feature integration
```

```text
Feature contract
      ↓
ML + Detection integration
```

```text
Evidence + ML contracts
      ↓
Fusion integration
```

```text
Alert contract
      ↓
Backend integration
      ↓
Dashboard integration
```

Do not wait until the end to discover incompatible schemas.

---

# 19. Priority When Blocked

If an agent becomes blocked, it should not start unrelated features merely to appear productive.

It should:

1. identify the missing dependency
2. create/use a contract fixture
3. continue independent work where possible
4. report the blocker
5. avoid changing another agent's architecture

---

# 20. AI Coding Standard

Every AI agent must:

1. Inspect the repository before editing.
2. Read relevant documentation.
3. Understand its ownership boundary.
4. Inspect existing code before creating duplicates.
5. Implement the smallest correct solution.
6. Add tests.
7. Run tests.
8. Keep changes focused.
9. Avoid unnecessary dependencies.
10. Report assumptions and limitations.

AI-generated code is not considered correct merely because it compiles.

---

# 21. Security Boundary

The entire monitoring system operates inside the observation/analytics environment.

The implementation must preserve:

```text
Observed Network
      |
      | one-way traffic/data
      v
Monitoring Enclave
      |
      +--> ingest
      +--> analysis
      +--> ML
      +--> alerts
      +--> dashboard
```

There must be no implementation path from the analytics system back into the observed production network.

This is a system-level architectural constraint, not merely a feature.

---

# 22. Completion Criteria

The agent workflow is successful when:

- all required components exist
- contracts are consistent
- all six official top-level threat categories are represented, with DGA and DNS tunnelling both covered under the DNS category
- ML is genuine and reproducible
- evidence fusion is explainable
- alerts follow the canonical schema
- the dashboard consumes real alerts
- the full pipeline works on controlled replayed traffic
- tests pass
- throughput and latency are measured
- no passive-only constraints are violated

---

# 23. Final Rule

**Parallelism accelerates implementation; contracts preserve correctness.**

Agents should move as fast as possible, but never by silently changing the system's requirements, architecture, detection methodology, security boundary, or evidence model.
