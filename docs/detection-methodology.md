# Detection Methodology

## 1. Purpose

This document defines the detection methodology for the AI-based cyber-threat detection pipeline in Problem Statement 26145.

The system is designed for a strictly unidirectional monitoring environment. It must detect and classify suspicious network behavior using only passively observed traffic metadata. It must not probe, handshake with, query, decrypt, block, or otherwise communicate back to the observed network.

The methodology is intentionally implementation-oriented. It defines what the detection system should measure, how machine learning participates, how behavioral evidence is combined, and how alerts are produced.

---

## 2. Detection Philosophy

The system must not reduce detection to:

```text
traffic -> one classifier -> label
```

Instead, the intended reasoning pipeline is:

```text
Passive Traffic
      |
      v
Metadata Extraction
      |
      v
Common Feature Engine
      |
      v
Behavioral Context
      |
      +--------------------+
      |                    |
      v                    v
Statistical Signals    ML Prediction
      |                    |
      +---------+----------+
                |
                v
         Evidence Fusion
                |
                v
        Threat Hypothesis
                |
        +-------+-------+
        |               |
        v               v
   Confidence       Severity
        |               |
        +-------+-------+
                |
                v
        Explainable Alert
```

The central design principle is **behavioral evidence fusion**.

A single feature should rarely be treated as proof of a threat. The system should combine multiple independently derived signals and use temporal and host-level context wherever possible.

---

## 3. Role of Machine Learning

Machine learning is a core intelligence component, but it is not the entire detection methodology.

### 3.1 What the feature engine does

The feature engine converts passive network metadata into numerical measurements such as:

- packets per second
- bytes per second
- flow frequency
- destination diversity
- port diversity
- entropy
- inter-arrival statistics
- periodicity
- outbound/inbound byte ratios
- DNS lexical characteristics
- TLS/QUIC metadata characteristics

### 3.2 What behavioral analysis does

Behavioral analysis places those measurements into context.

Examples:

- Is a host suddenly communicating with hundreds of destinations?
- Is a connection repeating at highly regular intervals?
- Is outbound traffic substantially different from the host's normal pattern?
- Is DNS activity persistent, unusually long, or unusually random?

### 3.3 What statistical detectors do

Statistical detectors identify measurable patterns that are useful evidence.

Examples:

- traffic-rate spikes
- source-IP entropy
- periodicity
- fan-out
- byte asymmetry
- domain entropy
- burstiness

### 3.4 What machine learning does

The ML model learns relationships among engineered features from labeled or otherwise appropriately prepared training data.

For example, a model may learn that a combination of high packet rate, strong burstiness, destination concentration, and unusual source distribution is more characteristic of DDoS traffic than benign traffic.

The model output is treated as **evidence**, not unquestionable truth.

The prototype should begin with practical tabular models such as Random Forest or Gradient Boosting, with a simpler baseline such as Logistic Regression used where useful for comparison.

Deep learning is not a requirement. It should only be introduced if experiments demonstrate a meaningful benefit within the prototype constraints.

---

## 4. Common Feature Engine

The common feature engine produces reusable features shared across multiple threat detectors.

### 4.1 Flow features

- `duration`
- `packet_count`
- `byte_count`
- `packets_per_sec`
- `bytes_per_sec`
- `protocol`
- `src_port`
- `dst_port`
- `direction`

### 4.2 Temporal features

- `inter_arrival_mean`
- `inter_arrival_std`
- `inter_arrival_cv`
- `periodicity_score`
- `burstiness`
- `activity_duration`
- `events_per_window`
- `connection_frequency`

### 4.3 Behavioral and host features

- `unique_dst_ips`
- `unique_dst_ports`
- `unique_src_ips`
- `fan_out`
- `dst_concentration`
- `new_destination_ratio`
- `source_ip_entropy`
- `destination_ip_entropy`
- `destination_repetition`

These features should normally be calculated over bounded time windows or host/session context rather than relying only on individual packets.

---

## 5. Threat-Specific Feature Groups

### 5.1 DNS features

- `query_length`
- `subdomain_length`
- `digit_ratio`
- `unique_character_ratio`
- `domain_entropy`
- `vowel_consonant_ratio`
- `n_gram_score`
- `queries_per_sec`
- `unique_subdomains`
- `unique_domains`
- `record_type_distribution`
- `query_size`
- `response_size`
- `query_response_ratio`

### 5.2 TLS/QUIC metadata features

- TLS version
- cipher metadata where available
- JA3 / JA3S / JA4 where available
- fingerprint frequency
- packet-size statistics
- packet-size sequence characteristics
- inter-arrival statistics
- connection frequency
- session duration
- destination repetition

No decrypted payload is used.

### 5.3 Exfiltration features

- outbound bytes
- inbound bytes
- outbound/inbound byte ratio
- outbound bytes per second
- flow duration
- destination count
- new-destination ratio
- sustained-transfer indicators
- deviation from a host's behavioral baseline

---

## 6. Behavioral Context

The system should maintain bounded behavioral state for relevant hosts, destinations, and communication relationships.

A behavioral context may include:

```text
Host
  |
  +-- recent flow rate
  +-- recent byte rate
  +-- recent destinations
  +-- recent ports
  +-- recent DNS behavior
  +-- recent TLS fingerprints
  +-- temporal patterns
```

The initial prototype should use bounded in-memory state.

A persistent or distributed state system should only be introduced if the measured workload requires it.

Behavioral state must have explicit expiration/retention rules so that memory usage remains bounded.

---

## 7. Evidence Signals

Threat-specific detectors should convert relevant observations into normalized evidence signals.

Conceptually:

```text
EvidenceSignal:
    signal_name
    value
    direction
    reliability
    supporting_features
```

Examples:

```text
high_packet_rate
strong_source_entropy
high_port_fanout
strong_periodicity
high_domain_entropy
long_dns_queries
high_outbound_ratio
suspicious_tls_fingerprint
```

An evidence signal is not itself an alert. It is one piece of reasoning used to support a threat hypothesis.

---

## 8. Evidence Fusion

The detection system should combine:

1. Statistical evidence
2. Behavioral evidence
3. Temporal evidence
4. ML prediction
5. Threat-specific evidence

The exact mathematical fusion and calibration method must not be frozen before experimentation.

The development process should compare candidate approaches using validation data and select an approach that is:

- measurable
- reproducible
- computationally practical
- explainable
- resistant to obvious false positives

The team must not invent arbitrary weights simply to produce an impressive confidence score.

If a weighted fusion model is ultimately selected, its weights must be justified using validation results or a documented calibration procedure.

---

## 9. Threat Detection Methodology

## 9.1 Volumetric / Protocol DDoS

### Objective

Identify flood-like behavior including:

- SYN floods
- UDP floods
- UDP reflection/amplification patterns
- spoofed-source flood patterns

### Main evidence

- packets per second
- bytes per second
- flow rate
- protocol distribution
- source-IP diversity
- source-IP entropy
- destination concentration
- burstiness
- temporal traffic spikes
- TCP SYN-related metadata where available

### Reasoning

The detector should not treat high traffic volume alone as proof of DDoS.

A strong DDoS hypothesis should arise when multiple signals agree, for example:

```text
traffic spike
+
high packet rate
+
strong destination concentration
+
abnormal source distribution
+
burst-like behavior
```

For spoofed-source behavior, source diversity/entropy is supporting evidence rather than definitive proof of spoofing.

---

## 9.2 Botnet C2 Beaconing

### Objective

Detect repeated communication patterns consistent with automated command-and-control beaconing.

### Main evidence

- inter-arrival mean
- inter-arrival standard deviation
- coefficient of variation
- periodicity score
- connection frequency
- destination repetition
- packet-size similarity
- persistence over time

### Reasoning

A beaconing hypothesis becomes stronger when communication repeatedly targets a small destination set at relatively regular intervals.

Regularity alone is insufficient because legitimate software can communicate periodically.

The system should therefore consider:

```text
periodicity
+
destination persistence
+
repetition
+
unusual host behavior
+
ML classification
```

---

## 9.3 DGA Domains

### Objective

Identify DNS names with characteristics consistent with algorithmically generated domains.

### Main evidence

- domain/query length
- character entropy
- digit ratio
- unique-character ratio
- character distribution
- vowel/consonant characteristics
- n-gram score
- repeated unusual domain patterns

### Reasoning

The detector should learn or calculate whether the lexical structure of a domain resembles known benign or algorithmically generated patterns.

High entropy alone is not sufficient evidence because legitimate domains and encoded values can also have high entropy.

---

## 9.4 DNS Tunnelling

### Objective

Detect DNS behavior consistent with covert data transport.

### Main evidence

- long queries
- long subdomains
- high query frequency
- high lexical entropy
- many unique subdomains
- unusual record-type distribution
- query/response size relationships
- persistence over time

### Reasoning

DNS tunnelling differs from DGA detection.

DGA primarily concerns **domain generation characteristics**.

DNS tunnelling concerns **use of DNS as a data transport mechanism**.

A strong tunnelling hypothesis should therefore combine lexical, volume, temporal, and query-structure evidence.

---

## 9.5 Malware in Encrypted Sessions

### Objective

Identify suspicious encrypted-session behavior without decrypting payloads.

### Main evidence

- TLS/QUIC metadata
- JA3/JA3S/JA4 where available
- fingerprint frequency
- packet-size sequences
- timing characteristics
- connection frequency
- session duration
- destination repetition

### Reasoning

The system should identify **suspicious encrypted-session behavior**, not claim that metadata alone proves the presence of malware.

A fingerprint or traffic pattern is evidence that contributes to a threat hypothesis.

No payload decryption is permitted.

---

## 9.6 Reconnaissance / Port Scanning

### Objective

Identify scanning and reconnaissance-like behavior.

### Main evidence

- unique destination IPs
- unique destination ports
- fan-out
- host diversity
- port diversity
- connection frequency
- sequential-port behavior
- scan duration

The detector should account for both:

**Vertical scanning**

```text
one source
   |
   +--> many ports on one host
```

**Horizontal scanning**

```text
one source
   |
   +--> same/similar port across many hosts
```

Legitimate vulnerability scanners and administrative tools can resemble reconnaissance. The output should therefore use technically defensible language such as **reconnaissance-like behavior** when certainty is limited.

---

## 9.7 Data Exfiltration

### Objective

Identify outbound traffic patterns that may indicate unauthorized data transfer.

### Main evidence

- outbound bytes
- inbound bytes
- outbound/inbound byte ratio
- outbound transfer rate
- sustained transfer duration
- destination count
- new destinations
- behavioral-baseline deviation

### Reasoning

Large outbound transfers are not automatically malicious.

The detector should consider:

```text
volume
+
directional asymmetry
+
destination novelty
+
persistence
+
host behavioral deviation
+
ML evidence
```

The system should report suspicious exfiltration-like behavior rather than claim confirmed data theft.

---

## 10. ML Architecture Strategy

The initial implementation should use a shared feature engine and threat-aware models/detectors.

Conceptually:

```text
                 Common Feature Engine
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
      DDoS model       C2 model       Recon model
          |               |               |
          +---------------+---------------+
                          |
                   Other detectors
                          |
                          v
                    Evidence Fusion
```

However, six completely independent ML models are not mandatory.

During implementation, the team should determine whether each threat is best served by:

- an ML classifier
- statistical detection
- ML plus statistical detection
- a shared multi-class model
- a specialized model

The choice must be based on validation results and implementation practicality.

The requirement is a genuine ML component in the overall pipeline, not six models for appearance.

---

## 11. Training Strategy

Training data should consist of authorized synthetic or lab-generated traffic corresponding to the problem statement.

Examples include:

- benign traffic from controlled generators
- SYN/UDP flood traffic from isolated lab generators
- DNS tunnelling traffic from controlled lab tools
- DGA samples
- controlled C2-like beaconing
- reconnaissance traffic
- controlled transfer/exfiltration simulations

No real malware is required.

### Data preparation

The pipeline should:

1. Extract passive metadata.
2. Generate features.
3. Assign labels from controlled experiment ground truth.
4. Remove leakage-prone identifiers where appropriate.
5. Split data into training, validation, and test sets.
6. Evaluate the model on traffic it has not seen.

---

## 12. Validation and Data Leakage

Network-security datasets are especially vulnerable to leakage.

The system should avoid allowing nearly identical flows from the same experiment to appear across both training and test sets in a way that makes evaluation unrealistically easy.

Where possible, validation should separate by:

- capture/session
- attack run
- time period
- host scenario

rather than relying only on random row-level splitting.

The final report should clearly document the split strategy.

---

## 13. Evaluation Metrics

At minimum, evaluate:

- precision
- recall
- F1 score
- confusion matrix
- false-positive rate
- detection latency
- throughput

For probability-producing classifiers, probability calibration should be considered before interpreting model probabilities directly as confidence.

The team must report actual measured performance rather than estimated or invented numbers.

---

## 14. Confidence and Severity

Confidence and severity are different concepts.

### Confidence

How strongly the available evidence supports the threat hypothesis.

### Severity

How operationally significant the detected behavior appears.

For example:

```text
Threat: Reconnaissance
Confidence: 0.91
Severity: Medium
```

A confidence value must have a documented meaning.

If the ML probability is not calibrated, it must not automatically be presented as a real-world probability of compromise.

---

## 15. Explainable Alerts

Every alert should contain supporting evidence.

Example conceptual alert:

```json
{
  "timestamp": "...",
  "flow_id": "...",
  "threat_class": "C2_BEACONING",
  "confidence": 0.91,
  "severity": "HIGH",
  "evidence": [
    {
      "signal": "periodicity",
      "value": 0.94
    },
    {
      "signal": "destination_repetition",
      "value": 0.89
    },
    {
      "signal": "connection_frequency",
      "value": 0.87
    }
  ]
}
```

The exact alert schema is governed by the project contracts and must remain consistent between the detection engine, API, database, and dashboard.

---

## 16. Streaming Detection

Detection must happen incrementally.

The intended pattern is:

```text
incoming metadata
      |
      v
update bounded state
      |
      v
compute/update features
      |
      v
run relevant detectors
      |
      v
fuse evidence
      |
      v
emit alert
```

The system must not depend on waiting for the complete PCAP before generating detections.

For replayed PCAPs, the replay engine should preserve or simulate time progression sufficiently to demonstrate streaming behavior.

---

## 17. Unknown / Novel Behavior

Novel-behavior detection is an optional secondary capability.

It may be implemented later using techniques such as anomaly detection or unsupervised/semi-supervised modeling.

It must not delay or compromise the six mandatory threat classes.

The prototype should never claim that an anomaly is automatically a new cyberattack.

A technically safer interpretation is:

> behavior differs significantly from learned or observed normal patterns.

---

## 18. False Positive Handling

False positives are expected in network security.

The system should reduce them using:

- behavioral context
- multiple evidence signals
- temporal persistence
- host baselines
- destination context
- ML predictions
- confidence calibration

Alerts should be ranked rather than treating every suspicious signal as equally important.

The dashboard should make the evidence visible so that an analyst can understand why the alert was generated.

---

## 19. Detection Output

Every generated alert should contain, at minimum:

- timestamp
- flow or event identifier
- threat class
- confidence score
- severity
- supporting evidence

Recommended additional fields:

- source IP
- destination IP
- source port
- destination port
- protocol
- detection stage
- model/version identifier
- evidence signals
- feature snapshot
- explanation

Sensitive or unnecessary payload content must not be included.

---

## 20. Implementation Priority

Because the prototype has a five-day implementation window, development should proceed vertically rather than attempting all capabilities simultaneously.

### Priority 0

Build one complete end-to-end path:

```text
PCAP
 -> metadata
 -> features
 -> DDoS detector
 -> ML inference
 -> evidence fusion
 -> alert
 -> API
 -> dashboard
```

This proves the architecture.

### Priority 1

Add:

- reconnaissance
- C2 beaconing

These demonstrate temporal and behavioral reasoning.

### Priority 2

Add:

- DGA
- DNS tunnelling
- encrypted-session metadata detection
- exfiltration

### Priority 3

Improve:

- confidence calibration
- explainability
- performance
- dashboard quality
- optional novel-behavior detection

The priority order is for implementation sequencing only. The final prototype must cover all six mandatory threat categories.

---

## 21. Technical Claims We Will Not Make

The system must not claim:

- that passive metadata proves compromise
- that a JA3/JA4 fingerprint proves malware
- that high entropy proves DGA or DNS tunnelling
- that high traffic volume proves DDoS
- that outbound traffic proves exfiltration
- that periodic traffic proves C2
- that anomaly detection proves a zero-day attack
- that the system can prevent or block an attack
- that the system decrypts TLS/QUIC traffic
- that the system communicates back to monitored networks

The correct positioning is **passive threat detection and threat intelligence generation**.

---

## 22. Methodology Success Criteria

The methodology is successful when the prototype can demonstrate:

1. Strict read-only traffic observation.
2. No probes or return-path communication.
3. No TLS/QUIC payload decryption.
4. Incremental/streaming processing.
5. Reusable common feature extraction.
6. Behavioral and temporal context.
7. Genuine ML inference.
8. Statistical and threat-specific evidence.
9. Evidence fusion.
10. Explainable alerts.
11. Detection of all six required threat categories.
12. Measured throughput and latency.
13. Leakage-aware validation.
14. Reproducible experiments.

---

## 23. Final Design Principle

The system should answer more than:

> "Which class does this flow belong to?"

It should answer:

> "What behavior is occurring, what independent evidence supports it, how strongly does our learned model agree, and why did the system raise this alert?"

That distinction is central to the project's detection methodology and should guide implementation decisions throughout the prototype.
