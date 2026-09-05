# SIH 26145 — Official Problem Statement (Source of Truth)

> This file is the verbatim official text. Do not paraphrase or "improve" it —

> if implementation needs deviate from this, that's a decision to record in

> [AGENTS.md](http://AGENTS.md)'s interpretation section, not a reason to edit this file.

**Title:** AI-Based Detection of Cyber Threats in Unidirectional IP Traffic  

**Organization / Department:** National Technical Research Organisation (NTRO)  

**Category:** Software  

**Theme:** Blockchain & Cybersecurity

## Background

Critical-infrastructure operators observe their gateway and peering links using

passive mirroring or hardware data diodes that copy traffic into a monitoring

enclave in one direction only. The enclave can see everything crossing the

link, but has no physical or protocol-level path back into the production

network. This is deliberate: it removes an entire class of attack where a

compromised monitoring system becomes a pivot into the core network, and

preserves a clean chain of custody for forensics.

The trade-off: any intelligence layer in that enclave must work purely from

what it can passively observe — packet captures, exported flow records

(NetFlow/IPFIX/sFlow), derived metadata — with no ability to send probes,

complete handshakes with the traffic source, or push a mitigation command back.

## Description

Design and build an AI/ML pipeline that ingests a one-directional stream of

IP traffic from simulated IP data and detects, classifies, and scores

cyber-security threats in near real time, using only passively collected

data. The pipeline can never re-contact the traffic's source or destination,

cannot complete any handshake itself, and cannot issue any action back across

the ingest path. Output is intelligence: labelled alerts, confidence scores,

supporting evidence, on a visualisation dashboard.

### Threat types to detect

| # | Threat | Detection basis |

|---|---|---|

| a | Volumetric / protocol DDoS (SYN floods, UDP reflection/amplification, spoofed-source floods) | Flow-level rate + source-IP entropy statistics |

| b | Botnet C2 beaconing | Periodicity / inter-arrival analysis toward a small set of destinations |

| c | DGA domains and DNS tunnelling | Entropy/n-gram analysis of DNS query names, query-length and record-type anomalies |

| d | Malware inside encrypted sessions | TLS/QUIC metadata only (JA3/JA3S/JA4, packet-size and timing sequences) — no decryption |

| e | Reconnaissance / port scanning | Fan-out from one source across many destination ports/hosts |

| f | Data exfiltration | Asymmetric flow-volume anomalies, unusual outbound/inbound byte ratios |

## Expected Solution

Working prototype (source repository): ingest, feature extraction, model

inference, alert output. Documentation of model(s) used, features engineered,

training approach, validation approach. Simple dashboard of live or replayed

detections with severity and confidence.

### Mandatory architectural constraints

- **Read-only ingest** — no return path, no live query to source, no inline block.

- **No payload decryption** — TLS/QUIC analysed from metadata only.

- **Streaming, not batch** — incremental processing, bounded-latency alerts.

- **Defined throughput target** — must state and demonstrate tested rate (flows/sec or Mbps sustained).

- **Standardized alert schema** — timestamp, flow identifier, threat class, confidence score, supporting evidence feature, minimum.

## Dataset Direction

- Benign: iperf3, Ostinato, TRex, normal DNS/HTTP/HTTPS/TLS/QUIC background traffic.

- Attack: hping3 (SYN/UDP floods), Slowloris (slow HTTP exhaustion), dnscat2/iodine (DNS tunnelling), DGA samples (e.g. DGArchive), sandboxed C2 emulator for beaconing timing.

- All attack-traffic generation confined to an isolated, authorized lab environment.

- No real malware.