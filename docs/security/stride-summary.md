# STRIDE Summary

This document consolidates threat modeling across key PokerHub components.  
It merges prior service‑specific STRIDE analyses into a single reference for the app,
analytics, tournament, and wallet services.

## App
- **Spoofing**: Attackers forge session tokens to impersonate users. Mitigation: signed short‑lived JWTs and TLS everywhere.
- **Tampering**: Malicious clients alter request payloads. Mitigation: strict Zod validation and reject unexpected fields.
- **Repudiation**: Users deny performing actions. Mitigation: immutable audit logs with request hashes.
- **Information Disclosure**: Sensitive data leaks via unsecured endpoints. Mitigation: RBAC on every route and mask secrets in logs.
- **Denial of Service**: Flooded requests overwhelm API or websocket gateway. Mitigation: per‑IP rate limits and autoscaling.
- **Elevation of Privilege**: XSS or auth bypass grants higher privileges. Mitigation: sanitize HTML, enforce CSP, and server‑side checks.

## Analytics
- **Spoofing**: Rogue producers inject fake events. Mitigation: API keys per producer and signed messages.
- **Tampering**: Events altered in transit. Mitigation: append‑only Kafka topics with checksum verification.
- **Repudiation**: Services deny emitting metrics. Mitigation: centralized logging with immutable timestamps.
- **Information Disclosure**: Unauthorized access to analytics data. Mitigation: role‑based dashboards and field redaction.
- **Denial of Service**: Event floods overwhelm pipeline. Mitigation: Kafka quotas, autoscaled consumers, and cold storage overflow.
- **Elevation of Privilege**: Analysts gain write access or production reach. Mitigation: isolated networks and reviewed IAM changes.

## Tournament
- **Spoofing**: Fake registrations or balancer nodes. Mitigation: signed tokens and mutual auth between workers.
- **Tampering**: Manipulated seating or blind levels. Mitigation: versioned configs with CRC checks and consensus confirmation.
- **Repudiation**: Players dispute eliminations or prizes. Mitigation: cryptographic hand history and payout logs.
- **Information Disclosure**: Premature bracket or player info exposure. Mitigation: limit access, scrub spectator views, encrypt at rest.
- **Denial of Service**: Registration floods or worker starvation. Mitigation: sign‑up throttling and autoscaled consumers.
- **Elevation of Privilege**: Unauthorized table control or prize overrides. Mitigation: segregated duties and least privilege enforcement.

## Wallet
- **Spoofing**: Impersonation of wallet services or users. Mitigation: mutual TLS, hardware keys, and signed requests.
- **Tampering**: Altered transactions or balances. Mitigation: append‑only ledger with hash chaining and daily checksums.
- **Repudiation**: Users dispute deposits or withdrawals. Mitigation: signed transaction receipts and tamper‑evident logs.
- **Information Disclosure**: Exposure of balances or PII. Mitigation: encrypt fields and restrict queries.
- **Denial of Service**: Flooded wallet APIs block transfers. Mitigation: per‑account rate limits and queued transactions.
- **Elevation of Privilege**: Escalation from read‑only to transfer rights. Mitigation: strict RBAC, IAM audits, and MFA for high‑value actions.

## Open Issues
- **App**: Device fingerprint binding is not enforced; introduce hardware‑backed tokens for high‑risk sessions.
- **Analytics**: Lacks alerting on unusual query volume; add anomaly detection and weekly sanity checks.
- **Tournament**: Payout distribution has no second‑signer verification; implement dual approval.
- **Wallet**: Withdrawal requests still rely on software keys; deploy hardware security modules for signing.
