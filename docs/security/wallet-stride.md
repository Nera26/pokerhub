# Wallet STRIDE Analysis

## Spoofing
- **Threat**: Attackers impersonate wallet services or user identities to redirect funds.
- **Mitigations**: Mutual TLS between services, hardware‑backed key storage, and signed transfer requests.

## Tampering
- **Threat**: Transactions or balances altered in transit or at rest.
- **Mitigations**: Append-only ledger with hash chaining, database integrity constraints, and daily checksum verification.

## Repudiation
- **Threat**: Users dispute deposits or withdrawals.
- **Mitigations**: Store signed transaction receipts and retain provider callbacks in tamper‑evident logs.

## Information Disclosure
- **Threat**: Exposure of account balances or PII.
- **Mitigations**: Encrypt sensitive fields, restrict queries to least privilege service accounts, and scrub data in logs.

## Denial of Service
- **Threat**: Attackers flood wallet APIs, blocking legitimate transfers.
- **Mitigations**: Rate‑limit per account, queue transactions, and degrade gracefully with circuit breakers.

## Elevation of Privilege
- **Threat**: Escalation from read-only to transfer rights via injection or misconfigurations.
- **Mitigations**: Enforce strict RBAC, run automated IAM audits, and require multi-factor approvals for high-value operations.
