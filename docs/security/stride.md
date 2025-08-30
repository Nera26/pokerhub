# STRIDE Threat Model

This document applies the STRIDE framework to PokerHub's platform.

## Spoofing
- **Threat**: Impersonation of players or services.
- **Mitigations**: OAuth-based authentication, device fingerprinting, and signed game actions.

## Tampering
- **Threat**: Modification of data in transit or at rest.
- **Mitigations**: TLS for all network traffic, integrity checks on hand histories, and immutable audit logs.

## Repudiation
- **Threat**: Players denying actions or transactions.
- **Mitigations**: Non-repudiation via digital signatures and comprehensive event logging stored for 5 years.

## Information Disclosure
- **Threat**: Leakage of personal or game information.
- **Mitigations**: Role-based access control, encryption of sensitive fields, and strict data retention policies.

## Denial of Service
- **Threat**: Attacks that degrade availability of lobbies or gameplay.
- **Mitigations**: Rate limiting, auto-scaling infrastructure, and DDoS protection at the edge.

## Elevation of Privilege
- **Threat**: Gaining unauthorized capabilities.
- **Mitigations**: Least privilege IAM roles, multi-factor admin access, and continuous security reviews.
