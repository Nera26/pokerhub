# STRIDE Summary

This document consolidates threat modeling across key PokerHub components.  
It merges prior service‑specific STRIDE analyses into a single reference for the app,
analytics, tournament, and wallet services.

## App
- **Spoofing**: Attackers forge session tokens to impersonate users. Mitigation: signed short‑lived JWTs and TLS everywhere (`backend/src/session/session.service.ts`, `infra/global-lb/ingress.yaml`).
- **Tampering**: Malicious clients alter request payloads. Mitigation: strict Zod validation and reject unexpected fields (`backend/src/schemas/*`).
- **Repudiation**: Users deny performing actions. Mitigation: immutable audit logs with request hashes (`backend/src/logging/`).
- **Information Disclosure**: Sensitive data leaks via unsecured endpoints. Mitigation: RBAC on every route and mask secrets in logs (`backend/src/auth/auth.guard.ts`).
- **Denial of Service**: Flooded requests overwhelm API or websocket gateway. Mitigation: per‑IP rate limits and autoscaling (`backend/src/auth/rate-limit.middleware.ts`, `infra/monitoring/`).
- **Elevation of Privilege**: XSS or auth bypass grants higher privileges. Mitigation: sanitize HTML, enforce CSP, and server‑side checks (`backend/src/auth/security.middleware.ts`).

## Analytics
- **Spoofing**: Rogue producers inject fake events. Mitigation: API keys per producer and signed messages (`backend/src/analytics/analytics.module.ts`).
- **Tampering**: Events altered in transit. Mitigation: append‑only Kafka topics with checksum verification (`backend/src/analytics/consume.ts`, `infra/kafka/helm`).
- **Repudiation**: Services deny emitting metrics. Mitigation: centralized logging with immutable timestamps (`backend/src/logging/`).
- **Information Disclosure**: Unauthorized access to analytics data. Mitigation: role‑based dashboards and field redaction (`frontend/src/app/components/dashboard/analytics`).
- **Denial of Service**: Event floods overwhelm pipeline. Mitigation: Kafka quotas, autoscaled consumers, and cold storage overflow (`backend/src/analytics/consume.ts`, `infra/kafka/helm`).
- **Elevation of Privilege**: Analysts gain write access or production reach. Mitigation: isolated networks and reviewed IAM changes (`infra/analytics`).

## Tournament
- **Spoofing**: Fake registrations or balancer nodes. Mitigation: signed tokens and mutual auth between workers (`backend/src/tournament/tournament.service.ts`).
- **Tampering**: Manipulated seating or blind levels. Mitigation: versioned configs with CRC checks and consensus confirmation (`backend/src/tournament/structures`).
- **Repudiation**: Players dispute eliminations or prizes. Mitigation: cryptographic hand history and payout logs (`backend/src/game/hand-log.ts`, `backend/src/tournament/prize.spec.ts`).
- **Information Disclosure**: Premature bracket or player info exposure. Mitigation: limit access, scrub spectator views, encrypt at rest (`backend/src/tournament/tournament.controller.ts`).
- **Denial of Service**: Registration floods or worker starvation. Mitigation: sign‑up throttling and autoscaled consumers (`backend/src/auth/rate-limit.middleware.ts`, `backend/src/tournament/scheduler.service.ts`).
- **Elevation of Privilege**: Unauthorized table control or prize overrides. Mitigation: segregated duties and least privilege enforcement (`backend/src/auth/admin.guard.ts`).

## Wallet
- **Spoofing**: Impersonation of wallet services or users. Mitigation: mutual TLS, hardware keys, and signed requests (`backend/src/wallet/payment-provider.service.ts`).
- **Tampering**: Altered transactions or balances. Mitigation: append‑only ledger with hash chaining and daily checksums (`backend/src/wallet/hand-ledger.ts`).
- **Repudiation**: Users dispute deposits or withdrawals. Mitigation: signed transaction receipts and tamper‑evident logs (`backend/src/wallet/webhook.controller.ts`).
- **Information Disclosure**: Exposure of balances or PII. Mitigation: encrypt fields and restrict queries (`backend/src/wallet/account.entity.ts`).
- **Denial of Service**: Flooded wallet APIs block transfers. Mitigation: per‑account rate limits and queued transactions (`backend/src/auth/rate-limit.middleware.ts`, `backend/src/wallet/settlement.service.ts`).
- **Elevation of Privilege**: Escalation from read‑only to transfer rights. Mitigation: strict RBAC, IAM audits, and MFA for high‑value actions (`backend/src/auth/admin.guard.ts`).

## Open Issues
- **App**: Device fingerprint binding is not enforced; introduce hardware‑backed tokens for high‑risk sessions.
- **Analytics**: Lacks alerting on unusual query volume; add anomaly detection and weekly sanity checks.
- **Tournament**: Payout distribution has no second‑signer verification; implement dual approval.
- **Wallet**: Withdrawal requests still rely on software keys; deploy hardware security modules for signing.
