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
