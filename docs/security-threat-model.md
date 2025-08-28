# Security Threat Model

This document outlines the STRIDE threat model for PokerHub.

## Spoofing
- Enforce strong authentication with short-lived JWTs and refresh token rotation.
- Same-site, HTTP-only cookies prevent credential reuse across sites.

## Tampering
- Helmet sets Content-Security-Policy and HSTS headers to protect against script injection and downgrade attacks.
- All wallet movements are recorded as immutable journal entries.

## Repudiation
- Transaction logs and span tracing provide non-repudiation for wallet operations.

## Information Disclosure
- Strict CSP reduces risk of data exfiltration.
- Geo-fencing and sanctions checks block access from high-risk regions.

## Denial of Service
- Velocity limits on deposits and withdrawals throttle abusive clients.

## Elevation of Privilege
- KYC verification and sanctions screening prevent prohibited users from accessing funds.

