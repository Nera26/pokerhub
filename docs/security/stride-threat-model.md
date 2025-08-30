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
