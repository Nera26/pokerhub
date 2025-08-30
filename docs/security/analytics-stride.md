# Analytics STRIDE Analysis

## Spoofing
- **Threat**: Rogue producers inject fake events or spoof service identities.
- **Mitigations**: Require API keys per producer and authenticate message signatures.

## Tampering
- **Threat**: Events modified en route to the warehouse.
- **Mitigations**: Use signed, append-only Kafka topics and verify checksums on ingestion.

## Repudiation
- **Threat**: Services deny emitting specific metrics or events.
- **Mitigations**: Centralize logging with immutable timestamps and correlate IDs across services.

## Information Disclosure
- **Threat**: Analytics data reveals user behavior or PII to unauthorized viewers.
- **Mitigations**: Role-based dashboards, row-level access policies, and redaction of sensitive fields.

## Denial of Service
- **Threat**: Event floods overwhelm the pipeline or warehouse.
- **Mitigations**: Backpressure via Kafka quotas, autoscale consumers, and archive overflow to cold storage.

## Elevation of Privilege
- **Threat**: Analysts gain write access or escalate to production systems.
- **Mitigations**: Isolate analytics network, enforce read-only roles, and review IAM changes.
