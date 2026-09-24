"""
unithreat.generator.traffic
===========================

Synthetic network flow event generator for testing and demonstration.

This module produces realistic, schema-compliant passive flow records for
evaluating the UniThreat detection pipeline across multiple threat scenarios:
  - benign: Normal background network traffic
  - ddos: Volumetric flood concentrated against target infrastructure
  - port_scan: Scanning probes across multiple destination ports/hosts
  - c2_beacon: Highly periodic outbound beaconing to an external C2 node
  - dns_tunnel: High-frequency, high-entropy DNS queries with data encapsulation
  - exfiltration: Large-volume, sustained outbound data transfers

Every generated record strictly adheres to contracts/flow-schema.json.
This generator is strictly for development and testing; it does NOT communicate
with real networks.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import random
import sys
import time
from typing import Any, Iterator

VALID_SCENARIOS = (
    "benign",
    "ddos",
    "port_scan",
    "c2_beacon",
    "dns_tunnel",
    "exfiltration",
    "dga",
    "encrypted_anomaly",
)

# Base start time for synthetic flows (deterministic reference)
DEFAULT_START_TIME = datetime(2026, 9, 6, 12, 0, 0, tzinfo=timezone.utc)


def _format_timestamp(dt: datetime) -> str:
    """Format datetime as ISO 8601 string conforming to date-time format."""
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


# Realistic destination IP and SNI pools for benign background traffic
BENIGN_HTTPS_DESTINATIONS: tuple[tuple[str, str], ...] = (
    ("142.250.190.46", "www.google.com"),
    ("142.250.180.14", "fonts.googleapis.com"),
    ("142.250.72.206", "mail.google.com"),
    ("93.184.216.34", "example.com"),
    ("93.184.216.119", "cdn.example.org"),
    ("151.101.1.140", "reddit.map.fastly.net"),
    ("151.101.65.140", "cdn.jsdelivr.net"),
    ("151.101.129.140", "api.github.com"),
    ("104.16.132.229", "cloudflare.com"),
    ("104.16.133.229", "cdnjs.cloudflare.com"),
    ("104.18.20.12", "discord.com"),
    ("52.84.125.33", "aws.amazon.com"),
    ("54.230.150.88", "d1.awsstatic.com"),
    ("13.107.42.16", "login.microsoft.com"),
    ("20.112.52.29", "portal.azure.com"),
    ("140.82.121.4", "github.com"),
    ("23.218.211.75", "a23-218-211-75.deploy.static.akamaitechnologies.com"),
)

BENIGN_HTTP_DESTINATIONS: tuple[tuple[str, str], ...] = (
    ("93.184.216.34", "example.com"),
    ("151.101.1.140", "http.badssl.com"),
    ("185.199.108.153", "pages.github.com"),
    ("185.199.109.153", "raw.githubusercontent.com"),
    ("185.199.110.153", "desktop.github.com"),
    ("151.101.193.67", "cnn.com"),
)


class TrafficGenerator:
    """
    Stateful traffic generator supporting deterministic scenario replay.
    """

    def __init__(
        self,
        scenario: str,
        seed: int | None = None,
        start_time: datetime | None = None,
    ) -> None:
        if scenario not in VALID_SCENARIOS:
            raise ValueError(
                f"Invalid scenario '{scenario}'. Supported scenarios: {list(VALID_SCENARIOS)}"
            )

        self.scenario = scenario
        self.rng = random.Random(seed)
        self.current_time = start_time or DEFAULT_START_TIME

    def generate(self, count: int) -> Iterator[dict[str, Any]]:
        """
        Generate `count` flow records for the configured scenario.
        """
        if not isinstance(count, int) or count <= 0:
            raise ValueError("Count must be an integer greater than 0.")

        handler = getattr(self, f"_generate_{self.scenario}")
        for idx in range(1, count + 1):
            yield handler(idx)

    def _generate_benign(self, idx: int) -> dict[str, Any]:
        delta_sec = self.rng.uniform(0.05, 1.2)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        flow_type = self.rng.choices(
            ["https", "http", "dns", "internal", "ntp"],
            weights=[50, 15, 20, 10, 5],
        )[0]

        src_ip = f"192.168.1.{self.rng.randint(10, 150)}"
        src_port = self.rng.randint(1024, 65535)

        if flow_type == "https":
            dst_ip, sni = self.rng.choice(BENIGN_HTTPS_DESTINATIONS)
            dst_port = 443
            protocol = "TCP"
            direction = "outbound"
            duration = round(self.rng.uniform(0.2, 8.0), 4)
            packet_count = self.rng.randint(12, 60)
            byte_count = self.rng.randint(2500, 45000)
            tcp_flags = "ACK-PSH"
            tls: dict[str, Any] | None = {
                "version": "TLS 1.3",
                "sni": sni,
            }
            dns = None

        elif flow_type == "http":
            dst_ip, _ = self.rng.choice(BENIGN_HTTP_DESTINATIONS)
            dst_port = 80
            protocol = "TCP"
            direction = "outbound"
            duration = round(self.rng.uniform(0.1, 3.5), 4)
            packet_count = self.rng.randint(8, 25)
            byte_count = self.rng.randint(900, 12000)
            tcp_flags = "ACK-PSH"
            tls = None
            dns = None

        elif flow_type == "dns":
            dst_ip = self.rng.choice(["8.8.8.8", "1.1.1.1", "192.168.1.1"])
            dst_port = 53
            protocol = "UDP"
            direction = "outbound"
            duration = round(self.rng.uniform(0.01, 0.08), 4)
            packet_count = 2
            byte_count = self.rng.randint(110, 380)
            tcp_flags = None
            tls = None
            dns = {
                "query": self.rng.choice(["updates.ubuntu.com", "slack.com", "api.github.com", "wikipedia.org"]),
                "qtype": "A",
                "rcode": "NOERROR",
            }

        elif flow_type == "internal":
            dst_ip = f"192.168.1.{self.rng.choice([5, 20, 25, 30])}"
            dst_port = self.rng.choice([22, 445, 8080])
            protocol = "TCP"
            direction = "internal"
            duration = round(self.rng.uniform(0.5, 15.0), 4)
            packet_count = self.rng.randint(15, 80)
            byte_count = self.rng.randint(1800, 32000)
            tcp_flags = "ACK-PSH"
            tls = None
            dns = None

        else:  # ntp
            dst_ip = "129.6.15.28"
            dst_port = 123
            protocol = "UDP"
            direction = "outbound"
            duration = 0.005
            packet_count = 2
            byte_count = 96
            tcp_flags = None
            tls = None
            dns = None

        return {
            "flow_id": f"benign-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "direction": direction,
            "duration": duration,
            "packet_count": packet_count,
            "byte_count": byte_count,
            "tcp_flags": tcp_flags,
            "dns": dns,
            "tls": tls,
            "quic": None,
        }

    def _generate_ddos(self, idx: int) -> dict[str, Any]:
        # High flow rate: tiny timestamp increments
        delta_sec = self.rng.uniform(0.0005, 0.004)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        target_ip = "10.0.0.50"
        src_ip = f"{self.rng.randint(11, 220)}.{self.rng.randint(1, 254)}.{self.rng.randint(1, 254)}.{self.rng.randint(1, 254)}"
        src_port = self.rng.randint(1024, 65535)

        is_syn = self.rng.random() < 0.70
        if is_syn:
            protocol = "TCP"
            dst_port = self.rng.choice([80, 443])
            tcp_flags = "SYN"
            duration = round(self.rng.uniform(0.0001, 0.02), 4)
            packet_count = self.rng.randint(1, 3)
            byte_count = self.rng.randint(40, 180)
        else:
            protocol = "UDP"
            dst_port = self.rng.choice([53, 123, 80, 443, self.rng.randint(10000, 60000)])
            tcp_flags = None
            duration = round(self.rng.uniform(0.0, 0.01), 4)
            packet_count = self.rng.randint(1, 5)
            byte_count = self.rng.randint(512, 1420)

        return {
            "flow_id": f"ddos-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": target_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "direction": "inbound",
            "duration": duration,
            "packet_count": packet_count,
            "byte_count": byte_count,
            "tcp_flags": tcp_flags,
            "dns": None,
            "tls": None,
            "quic": None,
        }

    def _generate_port_scan(self, idx: int) -> dict[str, Any]:
        # Rapid scanning probes from a single scanner host
        delta_sec = self.rng.uniform(0.005, 0.025)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        scanner_ip = "192.168.1.105"
        target_ip = "192.168.1.50"

        # Common scanned port list mixed with sequential ports
        scan_ports = [
            21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443,
            445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443,
        ]
        if idx <= len(scan_ports):
            dst_port = scan_ports[idx - 1]
        else:
            dst_port = self.rng.randint(1, 1024)

        return {
            "flow_id": f"portscan-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": scanner_ip,
            "dst_ip": target_ip,
            "src_port": self.rng.randint(40000, 65535),
            "dst_port": dst_port,
            "protocol": "TCP",
            "direction": "internal",
            "duration": round(self.rng.uniform(0.0002, 0.015), 4),
            "packet_count": 1,
            "byte_count": self.rng.choice([40, 44, 52, 60]),
            "tcp_flags": "SYN",
            "dns": None,
            "tls": None,
            "quic": None,
        }

    def _generate_c2_beacon(self, idx: int) -> dict[str, Any]:
        # Highly periodic beaconing (e.g. 30s interval with subtle jitter)
        jitter = self.rng.gauss(0.0, 0.4)
        delta_sec = max(1.0, 30.0 + jitter)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        compromised_host = "192.168.1.42"
        c2_server = "198.51.100.25"

        return {
            "flow_id": f"c2-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": compromised_host,
            "dst_ip": c2_server,
            "src_port": 49821,
            "dst_port": 443,
            "protocol": "TCP",
            "direction": "outbound",
            "duration": round(self.rng.uniform(0.22, 0.28), 4),
            "packet_count": self.rng.choice([6, 8]),
            "byte_count": self.rng.choice([512, 528, 544]),
            "tcp_flags": "ACK-PSH",
            "dns": None,
            "tls": {
                "version": "TLS 1.3",
                "ja3": "a0e9f5d64349fb13191bc781f81f42e1",
                "sni": "telemetry-sync.cloud-api.net",
            },
            "quic": None,
        }

    def _generate_dns_tunnel(self, idx: int) -> dict[str, Any]:
        # High frequency DNS queries with encoded payload subdomains
        delta_sec = self.rng.uniform(0.04, 0.18)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        src_ip = "192.168.1.88"
        dst_ip = "8.8.8.8"

        # Long, high-entropy encoded subdomain (e.g. base32/hex data)
        payload_chunk = "".join(self.rng.choices("0123456789abcdef", k=48))
        query = f"{payload_chunk}.tunnel.data-exfil.org"

        return {
            "flow_id": f"dnstunnel-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": self.rng.randint(30000, 65535),
            "dst_port": 53,
            "protocol": "UDP",
            "direction": "outbound",
            "duration": round(self.rng.uniform(0.015, 0.09), 4),
            "packet_count": self.rng.choice([2, 4]),
            "byte_count": self.rng.randint(480, 1380),
            "tcp_flags": None,
            "dns": {
                "query": query,
                "qtype": "TXT",
                "rcode": "NOERROR",
                "query_length": len(query),
            },
            "tls": None,
            "quic": None,
        }

    def _generate_exfiltration(self, idx: int) -> dict[str, Any]:
        # Sustained, heavy outbound data transfer
        delta_sec = self.rng.uniform(2.0, 6.0)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        src_ip = "192.168.1.77"
        dst_ip = "203.0.113.88"

        byte_count = self.rng.randint(1_200_000, 8_500_000)
        packet_count = byte_count // self.rng.randint(1300, 1460)
        duration = round(self.rng.uniform(12.0, 48.0), 4)

        return {
            "flow_id": f"exfil-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": self.rng.randint(40000, 65535),
            "dst_port": 443,
            "protocol": "TCP",
            "direction": "outbound",
            "duration": duration,
            "packet_count": packet_count,
            "byte_count": byte_count,
            "tcp_flags": "ACK-PSH",
            "dns": None,
            "tls": {
                "version": "TLS 1.3",
                "sni": "vault-storage.cloud-sync.com",
            },
            "quic": None,
        }

    def _generate_dga(self, idx: int) -> dict[str, Any]:
        delta_sec = self.rng.uniform(0.1, 1.2)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        src_ip = f"192.168.1.{self.rng.choice([33, 44, 55, 66, 77])}"
        dst_ip = self.rng.choice(["8.8.8.8", "1.1.1.1", "9.9.9.9"])

        # Varied algorithmic domain generation with high consonant ratio, varied length, and varied TLDs
        domain_len = self.rng.randint(13, 23)
        consonants = "bcdfghjklmnpqrstvwxyz"
        vowels = "aeiou"
        digits = "0123456789"
        
        # Compose core label with high consonant concentration and varied runs
        core_chars = []
        for _ in range(domain_len):
            roll = self.rng.random()
            if roll < 0.78:
                core_chars.append(self.rng.choice(consonants))
            elif roll < 0.90:
                core_chars.append(self.rng.choice(vowels))
            else:
                core_chars.append(self.rng.choice(digits))
        core_label = "".join(core_chars)

        tld = self.rng.choice(["biz", "info", "net", "org", "cc", "top", "xyz", "club"])
        qtype = self.rng.choices(["A", "AAAA"], weights=[90, 10])[0]
        query = f"{core_label}.{tld}"

        return {
            "flow_id": f"dga-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": self.rng.randint(30000, 65535),
            "dst_port": 53,
            "protocol": "UDP",
            "direction": "outbound",
            "duration": round(self.rng.uniform(0.01, 0.08), 4),
            "packet_count": self.rng.choice([1, 2]),
            "byte_count": self.rng.randint(65, 150),
            "tcp_flags": None,
            "dns": {
                "query": query,
                "qtype": qtype,
                "rcode": "NOERROR",
                "query_length": len(query),
            },
            "tls": None,
            "quic": None,
        }

    def _generate_encrypted_anomaly(self, idx: int) -> dict[str, Any]:
        delta_sec = self.rng.uniform(0.5, 4.0)
        self.current_time = datetime.fromtimestamp(
            self.current_time.timestamp() + delta_sec, tz=timezone.utc
        )

        src_ip = f"192.168.1.{self.rng.randint(10, 180)}"
        dst_ip = self.rng.choice(["198.51.100.22", "203.0.113.88", "192.0.2.14", "185.199.110.153"])
        src_port = self.rng.randint(1024, 65535)

        # Diverse encrypted anomaly archetypes (not a single static signature)
        anomaly_type = self.rng.choices(
            ["obsolete_tls_cipher", "direct_ip_sni", "obsolete_quic", "keystroke_timing", "malicious_ja3"],
            weights=[30, 25, 15, 15, 15],
        )[0]

        if anomaly_type == "obsolete_tls_cipher":
            protocol = "TCP"
            dst_port = self.rng.choice([443, 8443])
            duration = round(self.rng.uniform(0.5, 5.0), 4)
            packet_count = self.rng.randint(10, 40)
            byte_count = self.rng.randint(2000, 15000)
            tcp_flags = "ACK-PSH"
            tls = {
                "version": self.rng.choice(["TLS 1.0", "TLS 1.1", "SSL 3.0"]),
                "sni": self.rng.choice(["secure-backup.cloud.net", "legacy-portal.internal-mgmt.org"]),
                "cipher_suite": self.rng.choice([
                    "TLS_RSA_WITH_RC4_128_MD5",
                    "TLS_RSA_WITH_3DES_EDE_CBC_SHA",
                    "TLS_RSA_WITH_RC4_128_SHA",
                    "TLS_RSA_WITH_DES_CBC_SHA",
                ]),
            }
            quic = None

        elif anomaly_type == "direct_ip_sni":
            protocol = "TCP"
            dst_port = self.rng.choice([443, 9443])
            duration = round(self.rng.uniform(0.2, 4.0), 4)
            packet_count = self.rng.randint(8, 30)
            byte_count = self.rng.randint(1500, 12000)
            tcp_flags = "ACK-PSH"
            ip_literal = self.rng.choice(["198.51.100.22", "203.0.113.88", "192.0.2.45"])
            tls = {
                "version": self.rng.choice(["TLS 1.2", "TLS 1.3"]),
                "sni": ip_literal,
            }
            quic = None

        elif anomaly_type == "obsolete_quic":
            protocol = "UDP"
            dst_port = 443
            duration = round(self.rng.uniform(0.1, 2.0), 4)
            packet_count = self.rng.randint(6, 25)
            byte_count = self.rng.randint(1200, 9000)
            tcp_flags = None
            tls = None
            quic = {
                "version": self.rng.choice(["Q043", "Q046", "Q050", "mvfst-24"]),
                "sni": self.rng.choice(["quic-edge.telemetry-node.net", "198.51.100.99"]),
            }

        elif anomaly_type == "keystroke_timing":
            protocol = "TCP"
            dst_port = self.rng.choice([443, 2222])
            duration = round(self.rng.uniform(15.0, 45.0), 4)
            packet_count = self.rng.randint(50, 120)
            # Small packets typical of interactive keystroke encrypted shell (bytes_per_packet <= 80)
            byte_count = packet_count * self.rng.randint(52, 74)
            tcp_flags = "ACK-PSH"
            tls = {
                "version": "TLS 1.3",
                "sni": "shell-relay.cloud-ops.net",
            }
            quic = None

        else:  # malicious_ja3
            protocol = "TCP"
            dst_port = 443
            duration = round(self.rng.uniform(0.4, 3.5), 4)
            packet_count = self.rng.randint(10, 35)
            byte_count = self.rng.randint(1800, 14000)
            tcp_flags = "ACK-PSH"
            tls = {
                "version": "TLS 1.2",
                "sni": "cdn-cache.cloud-service.com",
                "ja3": self.rng.choice([
                    "6734f37431670b3ab4292b8f60f29984",
                    "b32309a26951912be7dba376398abc3b",
                    "72a589da586844d7f0818ce684948eea",
                ]),
            }
            quic = None

        return {
            "flow_id": f"enc-anomaly-{idx:06d}",
            "timestamp": _format_timestamp(self.current_time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "direction": "outbound",
            "duration": duration,
            "packet_count": packet_count,
            "byte_count": byte_count,
            "tcp_flags": tcp_flags,
            "dns": None,
            "tls": tls,
            "quic": quic,
        }



def generate_flows(
    scenario: str,
    count: int,
    seed: int | None = None,
    start_time: datetime | None = None,
) -> Iterator[dict[str, Any]]:
    """
    Generate `count` flow records for a given `scenario`.

    Parameters
    ----------
    scenario : str
        One of 'benign', 'ddos', 'port_scan', 'c2_beacon', 'dns_tunnel', 'exfiltration'.
    count : int
        Number of flow records to generate (must be > 0).
    seed : int | None
        Optional random seed for deterministic generation.
    start_time : datetime | None
        Optional baseline timestamp (default: 2026-09-06T12:00:00Z).

    Returns
    -------
    Iterator[dict[str, Any]]
        Stream of raw flow dicts adhering strictly to contracts/flow-schema.json.
    """
    generator = TrafficGenerator(scenario=scenario, seed=seed, start_time=start_time)
    yield from generator.generate(count)


def write_flows_jsonl(
    flows: Iterator[dict[str, Any]],
    output_path: str | Path | None = None,
) -> int:
    """
    Write a stream of flow records to a JSONL file or stdout.

    Parameters
    ----------
    flows : Iterator[dict[str, Any]]
        Stream of flow dicts.
    output_path : str | Path | None
        File path to write to, or None / '-' for stdout.

    Returns
    -------
    int
        Total number of records written.
    """
    count = 0
    if output_path and str(output_path) != "-":
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as f:
            for flow in flows:
                f.write(json.dumps(flow) + "\n")
                count += 1
    else:
        for flow in flows:
            print(json.dumps(flow))
            count += 1
    return count


# ---------------------------------------------------------------------------
# Configurable Traffic Generator & Pipeline Runner
# ---------------------------------------------------------------------------

SUPPORTED_ATTACK_TYPES: tuple[str, ...] = (
    "mixed",
    "ddos",
    "c2",
    "dga",
    "dns_tunneling",
    "reconnaissance",
    "data_exfiltration",
    "encrypted_anomaly",
)

ATTACK_TYPE_ALIASES: dict[str, str] = {
    "mixed": "mixed",
    "ddos": "ddos",
    "c2": "c2_beacon",
    "c2_beacon": "c2_beacon",
    "dga": "dga",
    "dns_tunneling": "dns_tunnel",
    "dns_tunnel": "dns_tunnel",
    "reconnaissance": "port_scan",
    "port_scan": "port_scan",
    "recon": "port_scan",
    "data_exfiltration": "exfiltration",
    "exfiltration": "exfiltration",
    "encrypted_anomaly": "encrypted_anomaly",
}

# Cluster sizes tuned to satisfy windowed detection thresholds without artificial labels:
# - port_scan: >= 8 scanned ports/hosts -> 12 flows
# - ddos: >= 5 flows with high rate and multi-source -> 15 flows
# - c2_beacon: >= 4 periodic connections -> 5 flows
# - dns_tunnel, exfiltration, dga, encrypted_anomaly: 4-6 flows
MIXED_ATTACK_BURST_SPECS: tuple[tuple[str, int], ...] = (
    ("port_scan", 12),
    ("ddos", 15),
    ("c2_beacon", 5),
    ("dns_tunnel", 6),
    ("exfiltration", 4),
    ("dga", 6),
    ("encrypted_anomaly", 5),
)

SINGLE_ATTACK_BURST_SIZES: dict[str, int] = {
    "ddos": 15,
    "port_scan": 12,
    "c2_beacon": 5,
    "dns_tunnel": 6,
    "exfiltration": 4,
    "dga": 6,
    "encrypted_anomaly": 5,
}


class ConfigurableTrafficGenerator:
    """
    Configurable synthetic traffic generator producing mixed or focused attack flows
    interleaved with realistic benign background traffic for UniThreat AI pipeline evaluation.

    Parameters
    ----------
    count : int
        Total number of flow records to generate (must be > 0).
    rate : float
        Generation rate in flows per second (must be > 0).
    attack_ratio : float
        Percentage of flows exhibiting attack patterns (0.0 to 100.0).
    attack_type : str
        Attack pattern category: 'mixed', 'ddos', 'c2', 'dga', 'dns_tunneling',
        'reconnaissance', 'data_exfiltration', or 'encrypted_anomaly'.
    seed : int | None
        Optional random seed for deterministic generation.
    start_time : datetime | None
        Optional baseline timestamp for flow generation.
    """

    def __init__(
        self,
        count: int = 1000,
        rate: float = 10.0,
        attack_ratio: float = 20.0,
        attack_type: str = "mixed",
        seed: int | None = None,
        start_time: datetime | None = None,
    ) -> None:
        if isinstance(count, bool) or not isinstance(count, int) or count <= 0:
            raise ValueError(f"Count must be an integer greater than 0, got {count!r}.")
        if isinstance(rate, bool) or not isinstance(rate, (int, float)) or rate <= 0:
            raise ValueError(f"Rate must be a positive number greater than 0, got {rate!r}.")
        if (
            isinstance(attack_ratio, bool)
            or not isinstance(attack_ratio, (int, float))
            or not (0.0 <= float(attack_ratio) <= 100.0)
        ):
            raise ValueError(
                f"Attack ratio must be between 0 and 100, got {attack_ratio!r}."
            )

        canonical_type = str(attack_type).lower().strip()
        if canonical_type not in ATTACK_TYPE_ALIASES:
            raise ValueError(
                f"Invalid attack type '{attack_type}'. "
                f"Supported choices: {list(SUPPORTED_ATTACK_TYPES)}"
            )

        self.count = count
        self.rate = float(rate)
        self.attack_ratio = float(attack_ratio)
        self.raw_attack_type = attack_type
        self.attack_type = canonical_type
        self.internal_attack_type = ATTACK_TYPE_ALIASES[canonical_type]
        self.seed = seed
        self.rng = random.Random(seed)
        self.start_time = start_time or DEFAULT_START_TIME
        self.current_time = self.start_time

        self.total_attack_flows = int(round(self.count * (self.attack_ratio / 100.0)))
        self.total_benign_flows = self.count - self.total_attack_flows

        # Underlying scenario generators
        self._benign_gen = TrafficGenerator(
            "benign", seed=self.rng.randint(0, 2**31 - 1), start_time=self.start_time
        )
        self._scenario_gens: dict[str, TrafficGenerator] = {
            s: TrafficGenerator(
                s, seed=self.rng.randint(0, 2**31 - 1), start_time=self.start_time
            )
            for s in (
                "ddos",
                "port_scan",
                "c2_beacon",
                "dns_tunnel",
                "exfiltration",
                "dga",
                "encrypted_anomaly",
            )
        }
        self._scenario_counters: dict[str, int] = {
            k: 0 for k in ("benign",) + tuple(self._scenario_gens.keys())
        }

    def _plan_schedule(self) -> list[tuple[str, int]]:
        """
        Build an interleaved sequence of (scenario_name, batch_size) blocks
        that satisfies exact counts while maintaining detection window cohesion.
        """
        if self.internal_attack_type == "mixed":
            burst_specs = MIXED_ATTACK_BURST_SPECS
        else:
            b_size = SINGLE_ATTACK_BURST_SIZES.get(self.internal_attack_type, 10)
            burst_specs = ((self.internal_attack_type, b_size),)

        attack_bursts: list[tuple[str, int]] = []
        rem_attack = self.total_attack_flows
        spec_idx = 0
        while rem_attack > 0:
            stype, size = burst_specs[spec_idx % len(burst_specs)]
            actual_size = min(size, rem_attack)
            attack_bursts.append((stype, actual_size))
            rem_attack -= actual_size
            spec_idx += 1

        schedule: list[tuple[str, int]] = []
        num_bursts = len(attack_bursts)

        if num_bursts == 0:
            if self.total_benign_flows > 0:
                schedule.append(("benign", self.total_benign_flows))
            return schedule

        if self.total_benign_flows == 0:
            schedule.extend(attack_bursts)
            return schedule

        benign_per_burst = self.total_benign_flows // num_bursts
        rem_benign = self.total_benign_flows

        for burst in attack_bursts:
            b_chunk = min(benign_per_burst, rem_benign)
            if b_chunk > 0:
                schedule.append(("benign", b_chunk))
                rem_benign -= b_chunk
            schedule.append(burst)

        if rem_benign > 0:
            schedule.append(("benign", rem_benign))

        return schedule

    def generate(self) -> Iterator[dict[str, Any]]:
        """
        Yield schema-compliant flow records for the configured parameters.
        Flows strictly adhere to contracts/flow-schema.json.
        """
        schedule = self._plan_schedule()
        global_idx = 0

        for scenario, batch_size in schedule:
            for _ in range(batch_size):
                global_idx += 1
                self._scenario_counters[scenario] += 1
                local_idx = self._scenario_counters[scenario]

                if scenario == "benign":
                    self._benign_gen.current_time = self.current_time
                    flow = self._benign_gen._generate_benign(local_idx)
                    self.current_time = self._benign_gen.current_time
                    flow["timestamp"] = _format_timestamp(self.current_time)
                    flow["flow_id"] = f"benign-{global_idx:06d}"
                else:
                    gen = self._scenario_gens[scenario]
                    gen.current_time = self.current_time
                    handler = getattr(gen, f"_generate_{scenario}")
                    flow = handler(local_idx)
                    self.current_time = gen.current_time
                    flow["timestamp"] = _format_timestamp(self.current_time)
                    prefix = flow["flow_id"].split("-")[0]
                    flow["flow_id"] = f"{prefix}-{global_idx:06d}"

                yield flow

    def stream_flows(self, pacing: bool = True) -> Iterator[dict[str, Any]]:
        """
        Yield flows from generate(), sleeping (1.0 / rate) between flows when pacing=True.
        """
        delay = 1.0 / self.rate
        for flow in self.generate():
            yield flow
            if pacing and delay > 0:
                time.sleep(delay)

    def run_pipeline(
        self,
        pipeline: Any | None = None,
        api_url: str | None = None,
        pace: bool = False,
        quiet: bool = False,
    ) -> dict[str, Any]:
        """
        Feed all generated flows into either a local IntegratedPipeline or a remote REST API.

        Parameters
        ----------
        pipeline : IntegratedPipeline | None
            Local in-process pipeline instance. If None and api_url is None, creates default pipeline.
        api_url : str | None
            Base URL for UniThreat AI backend (e.g. http://127.0.0.1:8000).
        pace : bool
            Whether to pace transmission in wall-clock time according to self.rate.
        quiet : bool
            Suppress console progress display.

        Returns
        -------
        dict[str, Any]
            Execution metrics including flow counts and alerts breakdown.
        """
        import time as _t

        http_client = None
        if api_url is not None:
            import httpx

            api_url = api_url.rstrip("/")
            http_client = httpx.Client(timeout=10.0)
        elif pipeline is None:
            from unithreat.alerts.pipeline import IntegratedPipeline

            pipeline = IntegratedPipeline.with_default_models()

        alerts_collected: list[dict[str, Any]] = []
        flow_delay = (1.0 / self.rate) if pace else 0.0

        start_wall_time = _t.perf_counter()
        first_timestamp: str | None = None
        last_timestamp: str | None = None

        processed_count = 0
        benign_count = 0
        attack_count = 0

        for flow in self.generate():
            processed_count += 1
            if first_timestamp is None:
                first_timestamp = flow["timestamp"]
            last_timestamp = flow["timestamp"]

            if flow["flow_id"].startswith("benign-"):
                benign_count += 1
            else:
                attack_count += 1

            if http_client is not None:
                resp = http_client.post(f"{api_url}/ingest/flow", json=flow)
                resp.raise_for_status()
                data = resp.json()
                new_alerts = data.get("alerts", [])
                alerts_collected.extend(new_alerts)
            elif pipeline is not None:
                new_alerts = pipeline.process_flow(flow)
                alerts_collected.extend(new_alerts)

            if not quiet and (
                processed_count % max(1, self.count // 20) == 0
                or processed_count == self.count
            ):
                pct = (processed_count / self.count) * 100
                sys.stderr.write(
                    f"\r[UniThreat Traffic] Processed {processed_count}/{self.count} flows ({pct:.1f}%)..."
                )
                sys.stderr.flush()

            if flow_delay > 0:
                _t.sleep(flow_delay)

        if not quiet:
            sys.stderr.write("\n")
            sys.stderr.flush()

        elapsed_wall = max(_t.perf_counter() - start_wall_time, 0.0001)
        throughput_fps = round(processed_count / elapsed_wall, 2)

        sim_duration = 0.0
        if first_timestamp and last_timestamp:
            try:
                t1 = datetime.fromisoformat(first_timestamp.replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(last_timestamp.replace("Z", "+00:00"))
                sim_duration = round((t2 - t1).total_seconds(), 2)
            except Exception:
                pass

        by_class = Counter(a.get("threat_class", "UNKNOWN") for a in alerts_collected)
        by_sev = Counter(a.get("severity", "UNKNOWN") for a in alerts_collected)

        if http_client is not None:
            http_client.close()

        return {
            "total_flows": processed_count,
            "benign_flows": benign_count,
            "attack_flows": attack_count,
            "total_alerts": len(alerts_collected),
            "by_threat_class": dict(by_class),
            "by_severity": dict(by_sev),
            "simulated_duration_sec": sim_duration,
            "elapsed_wall_sec": round(elapsed_wall, 3),
            "throughput_fps": throughput_fps,
            "alerts": alerts_collected,
        }


def print_pipeline_summary(
    metrics: dict[str, Any],
    config: ConfigurableTrafficGenerator,
    target: str,
) -> None:
    """Print an analyst-facing SOC operations summary table of pipeline run."""
    lines = [
        "=" * 80,
        "   UniThreat AI — Synthetic Passive Traffic Generator & Detection Report   ",
        "=" * 80,
        "CONFIGURATION:",
        f"  Total Requested Flows: {config.count}",
        f"  Simulated Rate:        {config.rate:.1f} flows/sec",
        f"  Attack Ratio:          {config.attack_ratio:.1f}% ({config.total_benign_flows} benign, {config.total_attack_flows} attack)",
        f"  Attack Pattern:        {config.attack_type} ({config.internal_attack_type})",
        f"  Target Destination:    {target}",
        "",
        "FLOW GENERATION STATISTICS:",
        f"  Total Flows Generated: {metrics['total_flows']}",
        f"  Benign Flows:          {metrics['benign_flows']} ({metrics['benign_flows'] / max(1, metrics['total_flows']) * 100:.1f}%)",
        f"  Attack Flows:          {metrics['attack_flows']} ({metrics['attack_flows'] / max(1, metrics['total_flows']) * 100:.1f}%)",
        f"  Simulated Duration:    {metrics['simulated_duration_sec']:.2f}s",
        f"  Wall-Clock Time:       {metrics['elapsed_wall_sec']:.3f}s ({metrics['throughput_fps']:.1f} flows/sec)",
        "",
        "DETECTION PIPELINE RESULTS:",
        f"  Total Alerts Emitted:  {metrics['total_alerts']}",
    ]

    if metrics["by_threat_class"]:
        lines.append("  Alerts by Threat Class:")
        for tc, cnt in sorted(metrics["by_threat_class"].items()):
            lines.append(f"    - {tc:<22}: {cnt}")
    else:
        lines.append("  Alerts by Threat Class: None (0 alerts)")

    if metrics["by_severity"]:
        lines.append("  Alerts by Severity:")
        for sev, cnt in sorted(metrics["by_severity"].items()):
            lines.append(f"    - {sev:<10}: {cnt}")

    lines.append("=" * 80)
    print("\n".join(lines))


def parse_args(args: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments for configurable traffic generator and pipeline replay."""
    parser = argparse.ArgumentParser(
        prog="python -m unithreat.generator",
        description="UniThreat AI — Synthetic Passive Traffic Generator & Pipeline Replay Runner.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1000,
        help="Total number of flow records to generate (default: 1000). Must be > 0.",
    )
    parser.add_argument(
        "--rate",
        type=float,
        default=10.0,
        help="Target generation rate in flows per second (default: 10.0). Must be > 0.",
    )
    parser.add_argument(
        "--attack-ratio",
        type=float,
        default=20.0,
        help="Percentage of flows exhibiting attack patterns, 0.0 to 100.0 (default: 20.0).",
    )
    parser.add_argument(
        "--attack-type",
        type=str,
        default="mixed",
        help=(
            f"Attack pattern type. Choices: {', '.join(SUPPORTED_ATTACK_TYPES)} "
            "(aliases: c2_beacon, dns_tunnel, port_scan, recon, exfiltration)."
        ),
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output file path to save flows as JSONL (or '-' for stdout).",
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default=None,
        help="Target UniThreat REST API base URL (e.g. http://127.0.0.1:8000) for live ingest.",
    )
    parser.add_argument(
        "--pipeline",
        action="store_true",
        default=False,
        help="Run generated flows through in-process IntegratedPipeline.",
    )
    parser.add_argument(
        "--pace",
        action="store_true",
        default=False,
        help="Pace transmission in wall-clock time according to --rate (sleep 1/rate).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for deterministic flow generation.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        default=False,
        help="Suppress interactive progress output.",
    )

    parsed = parser.parse_args(args)

    if parsed.count <= 0:
        parser.error("--count must be greater than 0.")
    if parsed.rate <= 0:
        parser.error("--rate must be greater than 0.")
    if not (0.0 <= parsed.attack_ratio <= 100.0):
        parser.error("--attack-ratio must be between 0 and 100.")

    canonical_attack = parsed.attack_type.lower().strip()
    if canonical_attack not in ATTACK_TYPE_ALIASES:
        parser.error(
            f"Invalid --attack-type '{parsed.attack_type}'. "
            f"Supported choices: {', '.join(SUPPORTED_ATTACK_TYPES)}"
        )

    return parsed


def main(args: list[str] | None = None) -> int:
    """Main CLI entrypoint for configurable traffic generator."""
    try:
        parsed = parse_args(args)
    except SystemExit as e:
        return e.code if isinstance(e.code, int) else 1

    generator = ConfigurableTrafficGenerator(
        count=parsed.count,
        rate=parsed.rate,
        attack_ratio=parsed.attack_ratio,
        attack_type=parsed.attack_type,
        seed=parsed.seed,
    )

    # 1. Output to stdout
    if parsed.output == "-":
        for flow in generator.generate():
            print(json.dumps(flow))
            if parsed.pace:
                time.sleep(1.0 / generator.rate)
        return 0

    # 2. Output to JSONL file
    if parsed.output and parsed.output != "-":
        out_path = Path(parsed.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        written = write_flows_jsonl(generator.generate(), output_path=out_path)
        if not parsed.quiet:
            sys.stderr.write(
                f"Successfully generated {written} flows to {parsed.output}\n"
            )
        if not parsed.pipeline and not parsed.api_url:
            return 0

    # 3. Pipeline / API execution
    # Default action if output is omitted or --pipeline is specified
    target_desc = (
        f"Remote API at {parsed.api_url}"
        if parsed.api_url
        else "In-Process IntegratedPipeline (Realtime Detection & Alerting)"
    )

    metrics = generator.run_pipeline(
        api_url=parsed.api_url,
        pace=parsed.pace or (parsed.api_url is not None),
        quiet=parsed.quiet,
    )

    if not parsed.quiet:
        print_pipeline_summary(metrics, generator, target_desc)

    return 0


if __name__ == "__main__":
    sys.exit(main())
