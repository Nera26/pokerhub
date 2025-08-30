# KYC / AML Flow

PokerHub requires identity verification and anti-money-laundering checks during player onboarding.

## Onboarding Checks
1. Collect legal name, date of birth, and address.
2. Verify identity documents through the provider API.
3. Require selfie match when risk score exceeds threshold.

## Sanctions Screening
- Screen players against global sanctions and politically exposed person lists on every signup.
- Re-run screening nightly for existing accounts and lock matches pending review.

## Audit Logging
- Record all verification requests and provider responses with timestamps and reviewer IDs.
- Retain logs for seven years in immutable storage for regulatory audits.

## Escalation Steps
1. Flagged signups or transactions enter a manual review queue within 24 hours.
2. Compliance reviews evidence and either approves, requests additional documents, or marks the account high risk.
3. High-risk cases escalate to the security team for deeper investigation.
4. Confirmed suspicious activity triggers a Suspicious Activity Report to regulators and immediate account freeze.

## Sequence Diagrams

### Onboarding

```mermaid
sequenceDiagram
  participant P as Player
  participant A as App
  participant K as KYC Provider
  participant C as Compliance

  P->>A: Submit signup data
  A->>K: Send KYC request
  K-->>A: Return result
  alt Verified
    A-->>P: Activate account
  else Needs review
    A->>C: Escalate case
    C-->>P: Request additional docs
  end
```

### Verification

```mermaid
sequenceDiagram
  participant P as Player
  participant W as Wallet
  participant M as AML Engine
  participant C as Compliance

  P->>W: Cash in/out
  W->>M: Run AML checks
  M-->>W: Risk score
  alt Low risk
    W-->>P: Approve transaction
  else High risk
    W->>C: Hold for review
    C-->>P: Notify pending status
  end
```

### Escalation

```mermaid
sequenceDiagram
  participant A as App
  participant C as Compliance
  participant S as Security
  participant R as Regulator

  A->>C: Flag suspicious activity
  C->>S: Request investigation
  alt Confirmed issue
    S->>R: Report as required
    S->>A: Apply sanctions
  end
```
