"""
unithreat.ingest.adapters
=========================

Ingest adapters — one module per input source.

Each adapter converts a specific wire format or capture file type into a
stream of normalized :class:`~unithreat.ingest.models.Flow` objects.
All adapters satisfy the :class:`~unithreat.ingest.source.FlowSource`
protocol.

Current adapters
----------------
``jsonl``
    JSONL file replay.  A **development and demonstration tool** for
    replaying pre-captured or synthetic flow records from a text file.
    Not suitable as a production ingest path.

Planned adapters (not yet implemented)
---------------------------------------
``pcap``
    PCAP / PCAPNG file replay via passive metadata extraction.
    This is the primary reproducible demonstration path described in the
    SIH 26145 problem statement.

``netflow``
    NetFlow v5 / v9 UDP receiver for passive collection.

``ipfix``
    IPFIX (RFC 7011) message receiver.

``sflow``
    sFlow datagram receiver.

Adding a new adapter
--------------------
1. Create ``unithreat/ingest/adapters/<name>.py``.
2. Implement a generator function or class whose ``__iter__`` yields
   :class:`~unithreat.ingest.models.Flow` objects.
3. Validate each record via :func:`~unithreat.ingest.parser.parse_flow`
   or build the ``Flow`` directly if the source is already normalised.
4. Do **not** re-export the adapter from this ``__init__.py`` unless it
   is stable.  Callers import directly from the adapter module.
5. Add tests under ``tests/ingest/adapters/``.
"""
