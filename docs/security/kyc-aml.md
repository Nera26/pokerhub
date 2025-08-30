# KYC and AML Workflows

PokerHub integrates automated and manual checks to verify player identity and prevent money laundering.

Infrastructure workflow: see [`../../infra/analytics/kyc-aml-workflow.yaml`](../../infra/analytics/kyc-aml-workflow.yaml).

## Onboarding Workflow
```mermaid
flowchart TD
  A[Player Signup] --> B[Collect Identity Data]
  B --> C{KYC Provider}
  C -->|Verified| D[Account Activated]
  C -->|Unclear| E[Manual Review]
  E -->|Approved| D
  E -->|Rejected| F[Account Locked]
```

## Transaction Monitoring
```mermaid
flowchart TD
  T[Cash In/Out] --> G{AML Engine}
  G -->|Low Risk| H[Auto Approve]
  G -->|High Risk| I[Compliance Review]
  I -->|Clear| H
  I -->|Suspicious| F[Account Locked]
```

## Backend Flow
The wallet layer's [KycService](../../backend/src/wallet/kyc.service.ts) coordinates identity checks:
1. Region and Geo-IP checks reject blocked jurisdictions.
2. Sanctions and PEP APIs flag high-risk names before provider verification.
3. Results are cached; approved accounts are marked `kycVerified`, while denials are stored for review.

## Data Retention Policy
- **Identity Documents**: Stored encrypted for **7 years** after account closure.
- **KYC Provider Responses**: Retained for **7 years** in immutable logs.
- **Sanctions Screening Results**: Kept for **5 years** and revalidated nightly.
- **Transaction Histories**: Retained for **7 years** to satisfy AML regulations.
- **Manual Review Notes**: Retained for **5 years** with restricted access.

Sensitive data is encrypted at rest, access is logged, and deletion requests are honored once legal obligations expire.

