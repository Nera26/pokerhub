# STRIDE Threat Model

This document outlines security threats across PokerHub using the STRIDE framework. For process
details and monitoring flows, see the [KYC/AML flow](../compliance/kyc-aml-flow.md) and
[anti-collusion controls](anti-collusion.md).

## Spoofing
Impersonation of users or services is mitigated by strong authentication and
[KYC/AML checks](../compliance/kyc-aml-flow.md).

Mitigations:
- [`backend/src/auth/kyc.service.ts`](../../backend/src/auth/kyc.service.ts) validates government IDs and binds accounts to verified identities.
- [`backend/src/auth/auth.guard.ts`](../../backend/src/auth/auth.guard.ts) verifies JWT tokens on every request to prevent session reuse.

## Tampering
Data integrity is protected via signed transactions and monitored pipelines.

Mitigations:
- [`backend/src/game/game.gateway.ts`](../../backend/src/game/game.gateway.ts) hashes incoming actions and rejects duplicates.
- [`backend/src/wallet/settlement.service.ts`](../../backend/src/wallet/settlement.service.ts) signs withdrawals with HSM-backed keys to prevent modification.

## Repudiation
Audit logs and [anti-collusion analytics](anti-collusion.md) provide traceability for all actions.

Mitigations:
- [`backend/src/analytics/collusion.service.ts`](../../backend/src/analytics/collusion.service.ts) stores flagged sessions for later review.
- [`backend/src/analytics/collusion.queries.ts`](../../backend/src/analytics/collusion.queries.ts) schedules warehouse queries that persist evidence.

## Information Disclosure
Sensitive data is encrypted in transit and at rest; access follows least privilege.

Mitigations:
- [`backend/src/auth/auth.guard.ts`](../../backend/src/auth/auth.guard.ts) enforces role-based access to sensitive endpoints.
- [`backend/src/auth/kyc.service.ts`](../../backend/src/auth/kyc.service.ts) redacts personally identifiable information before storage.

## Denial of Service
Rate limiting and traffic scrubbing protect against volumetric attacks.

Mitigations:
- [`backend/src/auth/rate-limit.middleware.ts`](../../backend/src/auth/rate-limit.middleware.ts) caps requests per IP and user.
- [`backend/src/game/game.gateway.ts`](../../backend/src/game/game.gateway.ts) applies per-socket rate limits to throttle abusive clients.

## Elevation of Privilege
Role-based access control and regular reviews prevent unauthorized privilege gains.

Mitigations:
- [`backend/src/auth/admin.guard.ts`](../../backend/src/auth/admin.guard.ts) restricts administrative routes to vetted staff.
- [`backend/src/analytics/collusion.service.ts`](../../backend/src/analytics/collusion.service.ts) blocks flagged accounts from privileged actions.

For implementation details, see the workflow configs and queries under `../../infra/analytics/`.

## Issue Status
The gaps noted in earlier STRIDE reviews have been closed:
- Device fingerprint binding enforced with hardware-backed tokens.
- Analytics pipeline alerts on unusual query volume.
- Tournament payouts require dual approval.
- Wallet withdrawals use HSM-backed signing.

## Threats to Mitigation Mapping

| Threat | Mitigation | Code Reference |
| --- | --- | --- |
| Spoofing | KYC verification ties accounts to verified identities, preventing impersonation | [backend/src/auth/kyc.service.ts](../../backend/src/auth/kyc.service.ts), [backend/src/auth/auth.guard.ts](../../backend/src/auth/auth.guard.ts) |
| Tampering | The game gateway hashes and tracks actions to detect duplicates and alterations | [backend/src/game/game.gateway.ts](../../backend/src/game/game.gateway.ts), [backend/src/wallet/settlement.service.ts](../../backend/src/wallet/settlement.service.ts) |
| Repudiation | Collusion analytics flag shared devices, IPs, and suspicious transfers for audit trails | [backend/src/analytics/collusion.service.ts](../../backend/src/analytics/collusion.service.ts), [backend/src/analytics/collusion.queries.ts](../../backend/src/analytics/collusion.queries.ts) |
| Information Disclosure | Sanctions and country checks restrict access from high-risk regions | [backend/src/auth/auth.guard.ts](../../backend/src/auth/auth.guard.ts), [backend/src/auth/kyc.service.ts](../../backend/src/auth/kyc.service.ts) |
| Denial of Service | Per-socket and global rate limits throttle abusive clients | [backend/src/auth/rate-limit.middleware.ts](../../backend/src/auth/rate-limit.middleware.ts), [backend/src/game/game.gateway.ts](../../backend/src/game/game.gateway.ts) |
| Elevation of Privilege | Collusion detection and KYC workflows enforce fair play and verified access | [backend/src/analytics/collusion.service.ts](../../backend/src/analytics/collusion.service.ts), [backend/src/auth/admin.guard.ts](../../backend/src/auth/admin.guard.ts) |

## Related Documents

- [KYC/AML flow](../compliance/kyc-aml-flow.md)
- [Anti-collusion controls](anti-collusion.md)
