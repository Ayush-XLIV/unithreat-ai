# # [AGENTS.md](http://AGENTS.md) — UniThreat AI

## 1. Project

Project: UniThreat AI

Problem Statement:

SIH 26145 — AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

Organization:

National Technical Research Organisation (NTRO)

Category:

Software

Theme:

Blockchain & Cybersecurity

UniThreat AI is a passive AI/ML cybersecurity threat-detection prototype

designed for a strictly one-directional monitoring environment.

The system observes network traffic, extracts metadata, detects suspicious

behavior, classifies threats, assigns confidence and severity, and produces

evidence-backed alerts through a dashboard.

The system is defensive and must operate only in authorized, isolated

laboratory environments.

---

# 2. Source of Truth

The official problem statement is stored at:

`docs/official-problem-statement.md`

That file is the authoritative source for the SIH requirements.

Do not modify or reinterpret the official problem statement.

If an engineering decision goes beyond the official requirements, document

that decision separately rather than changing the official source.

When implementation convenience conflicts with an explicit SIH constraint,

the SIH constraint wins.

---

# 3. Official Requirements We Must Satisfy

The prototype must demonstrate:

- passive one-directional traffic observation

- traffic/flow ingestion

- feature extraction

- AI/ML model inference

- threat classification

- confidence scoring

- supporting evidence

- structured alerts

- dashboard visualization

- near-real-time / streaming processing

- measured throughput

- bounded detection latency

The six official threat categories are:

1. Volumetric / protocol DDoS

2. Botnet C2 beaconing

3. DGA domains and DNS tunnelling

4. Malware inside encrypted sessions

5. Reconnaissance / port scanning

6. Data exfiltration

The exact detection methods must respect the official problem statement.

---

# 4. Non-Negotiable Architecture

## Read-only monitoring

The system must NEVER:

- probe observed hosts

- initiate connections to observed hosts

- perform active scanning

- complete handshakes independently

- send mitigation commands

- block traffic inline

- modify observed traffic

- create a return path into the monitored network

The monitoring system only observes.

Conceptually:

Observed Network

      |

      | one-way traffic copy

      v

UniThreat AI

      |

      v

Detection / Intelligence

      |

      v

Dashboard

There must be no path from UniThreat AI back into the observed network.

---

## No payload decryption

TLS/QUIC analysis must use observable metadata only.

Allowed examples include:

- TLS version

- cipher metadata

- JA3 / JA3S / JA4 where available

- packet sizes

- packet timing

- inter-arrival times

- connection duration

- packet counts

- byte counts

- flow direction

- connection frequency

Payload decryption must never be required by the detection pipeline.

Do not claim that encrypted-session analysis proves malware infection.

Describe it as detection of suspicious encrypted-session behavior.

---

## Streaming

Do not build the system as an end-of-run batch report.

Preferred pipeline:

Traffic / PCAP Replay

        ↓

Incremental Events

        ↓

Feature Updates

        ↓

Detection

        ↓

Alert

Detection latency must be measurable.

---

# 5. Detection Philosophy

Do NOT design the system as six unrelated classifiers operating only on

individual flows.

The preferred architecture is:

Observed Traffic

      ↓

Passive Metadata

      ↓

Feature Extraction

      ↓

Behavioral Context

      ↓

Statistical Signals + ML

      ↓

Evidence Fusion

      ↓

Threat Hypothesis

      ↓

Confidence + Severity

      ↓

Explainable Alert

The important engineering principle is:

> Detect behavior, not just isolated packets or flows.

Where useful, maintain context across:

- flows

- hosts

- destinations

- time windows

- repeated connections

- DNS activity

- TLS/QUIC activity

- traffic volume

- fan-out

- temporal patterns

---

# 6. Behavioral Evidence Fusion

The main differentiation direction is detection methodology.

Instead of:

Flow → Classifier → Threat

prefer:

Flow

 ↓

Features

 ↓

Behavioral Context

 ↓

Temporal Context

 ↓

Multiple Evidence Signals

 ↓

ML Prediction

 ↓

Evidence Fusion

 ↓

Threat Hypothesis

 ↓

Confidence

 ↓

Explanation

 ↓

Alert

Multiple signals should contribute to a threat decision.

Example:

DNS tunnelling suspicion may combine:

- high DNS entropy

- unusually long queries

- high query frequency

- unusual subdomain behavior

- record-type anomalies

- temporal persistence

- ML prediction

A single anomalous feature must not automatically be treated as proof of

malicious activity.

---

# 7. Threat-Specific Detection

## DDoS

Important signals:

- packets/sec

- bytes/sec

- flows/sec

- SYN rate

- UDP rate

- unique sources

- source-IP entropy

- destination concentration

- traffic spikes

- packet-size behavior

## C2 Beaconing

Important signals:

- connection frequency

- inter-arrival times

- timing variance

- periodicity

- repeated destinations

- packet-size similarity

- connection duration

- behavioral persistence

## DGA

Important signals:

- domain length

- entropy

- digit ratio

- character diversity

- character distribution

- n-grams

- unusual domain structure

## DNS Tunnelling

Important signals:

- query length

- query frequency

- entropy

- unique subdomains

- repeated subdomain patterns

- record-type distribution

- response size

- query/response ratio

- temporal behavior

## Encrypted Sessions

Use metadata only:

- JA3 / JA3S / JA4 where available

- TLS version

- cipher metadata

- packet-size sequences

- packet timing

- inter-arrival behavior

- connection frequency

- destination behavior

## Reconnaissance

Important signals:

- unique destination hosts

- unique destination ports

- fan-out

- connection attempts/sec

- host diversity

- port diversity

- sequential-port behavior

- scan duration

## Exfiltration

Important signals:

- outbound bytes

- inbound bytes

- outbound/inbound ratio

- outbound bytes/sec

- flow duration

- destination count

- new destinations

- sustained transfer behavior

- deviation from normal host behavior

The feature list may evolve as experimentation reveals better features.

---

# 8. Machine Learning

The project must contain genuine ML training and inference.

Do not replace ML with hard-coded rules and present it as AI.

The ML pipeline must include:

1. Dataset creation

2. Feature extraction

3. Preprocessing

4. Training

5. Validation

6. Model serialization

7. Model loading

8. Inference

9. Confidence generation

10. Alert generation

Start with a practical tabular ML model.

Possible initial choices:

- Random Forest

- Gradient Boosting

- HistGradientBoosting

- XGBoost if justified

Do not use deep learning merely to make the project appear more advanced.

The simplest model that performs adequately is preferred.

---

# 9. First Vertical Slice

The first complete implementation should be:

Controlled DDoS traffic

        ↓

PCAP

        ↓

Passive metadata extraction

        ↓

Flow records

        ↓

Feature extraction

        ↓

Labeled dataset

        ↓

ML training

        ↓

Validation

        ↓

Saved model

        ↓

Replay unseen traffic

        ↓

Inference

        ↓

Confidence

        ↓

Structured alert

Only after this works should the team expand aggressively into the other

threat categories and dashboard features.

---

# 10. Dataset Rules

All attack traffic must be generated in an isolated, authorized lab.

Never use real malware.

The official dataset direction includes:

Benign:

- iperf3

- Ostinato

- TRex

- normal DNS/HTTP/HTTPS/TLS/QUIC traffic

Attack:

- hping3

- Slowloris

- dnscat2

- iodine

- DGA samples

- sandboxed C2 emulation

Prefer controlled captures with traceable labels.

Vary attack parameters and captures so that models do not simply memorize

specific IP addresses, ports, timestamps, or capture-specific artifacts.

---

# 11. ML Validation

Avoid data leakage.

Do not randomly split packets from the same session into both training and

testing data.

Prefer splitting by:

- capture

- scenario

- session

- time period

Evaluate using appropriate metrics such as:

- precision

- recall

- F1

- confusion matrix

- false-positive rate

- false-negative rate

- inference latency

- throughput

Accuracy alone is insufficient for imbalanced security datasets.

---

# 12. Alert Contract

Alerts must be structured records.

Minimum required information:

- timestamp

- flow identifier

- threat class

- confidence score

- supporting evidence

Preferred structure:

```json

{

  "alert_id": "ALT-000001",

  "timestamp": "2026-01-01T12:00:00Z",

  "flow_id": "flow-001",

  "source_ip": "10.0.0.10",

  "destination_ip": "10.0.0.20",

  "source_port": 54321,

  "destination_port": 443,

  "protocol": "TCP",

  "threat_class": "C2_BEACONING",

  "severity": "HIGH",

  "confidence": 0.93,

  "evidence": {},

  "model_version": "c2-v1"

}