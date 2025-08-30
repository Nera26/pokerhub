# STRIDE Threat Model

This document outlines security threats across PokerHub using the STRIDE framework.

## Spoofing
Impersonation of users or services is mitigated by strong authentication and [KYC checks](kyc-aml.md).

## Tampering
Data integrity is protected via signed transactions and monitored pipelines.

## Repudiation
Audit logs and [anti-collusion analytics](anti-collusion.md) provide traceability for all actions.

## Information Disclosure
Sensitive data is encrypted in transit and at rest; access follows least privilege.

## Denial of Service
Rate limiting and traffic scrubbing protect against volumetric attacks.

## Elevation of Privilege
Role-based access control and regular reviews prevent unauthorized privilege gains.

For implementation details, see the workflow configs under `../../infra/analytics/`.

## Threats to Mitigation Mapping

| Threat | Mitigation | Code Reference |
| --- | --- | --- |
| Spoofing | KYC verification ties accounts to verified identities, preventing impersonation | [backend/src/auth/kyc.service.ts](../../backend/src/auth/kyc.service.ts) |
| Tampering | The game gateway hashes and tracks actions to detect duplicates and alterations | [backend/src/game/game.gateway.ts](../../backend/src/game/game.gateway.ts) |
| Repudiation | Collusion analytics flag shared devices, IPs, and suspicious transfers for audit trails | [backend/src/analytics/collusion.ts](../../backend/src/analytics/collusion.ts) |
| Information Disclosure | Sanctions and country checks restrict access from high-risk regions | [backend/src/auth/kyc.service.ts](../../backend/src/auth/kyc.service.ts) |
| Denial of Service | Per-socket and global rate limits throttle abusive clients | [backend/src/game/game.gateway.ts](../../backend/src/game/game.gateway.ts) |
| Elevation of Privilege | Collusion detection and KYC workflows enforce fair play and verified access | [backend/src/analytics/collusion.ts](../../backend/src/analytics/collusion.ts), [backend/src/auth/kyc.service.ts](../../backend/src/auth/kyc.service.ts) |
