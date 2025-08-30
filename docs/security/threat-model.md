# STRIDE Threat Model

This model surveys PokerHub's attack surface across frontend, backend, and infrastructure layers.

## Frontend

| STRIDE | Example Threat | Mitigation |
| --- | --- | --- |
| Spoofing | Fake clients impersonating players | Authenticate via signed tokens and mutual TLS |
| Tampering | Modified script bundles inject malicious code | Subresource Integrity and Content Security Policy headers |
| Repudiation | Users deny actions performed in UI | Immutable audit logs linked to session IDs |
| Information Disclosure | Leakage of sensitive data via DOM or APIs | Strict CORS, CSP, and data minimization |
| Denial of Service | Browser automation floods endpoints | Rate limiting and bot detection |
| Elevation of Privilege | Client-side role manipulation | Server-side authorization checks |

## Backend

| STRIDE | Example Threat | Mitigation |
| --- | --- | --- |
| Spoofing | Forged API requests | JWT validation and HMAC signatures |
| Tampering | Altered game state or RNG seeds | Signed payloads and integrity checks |
| Repudiation | Players dispute transactions | Append-only ledgers with proof hashes |
| Information Disclosure | Exposed PII in logs or responses | Encryption at rest and access control |
| Denial of Service | Request floods or expensive queries | Rate limiting, quotas, and circuit breakers |
| Elevation of Privilege | Unauthorized admin actions | RBAC, MFA, and audit trails |

## Infrastructure

| STRIDE | Example Threat | Mitigation |
| --- | --- | --- |
| Spoofing | Rogue services within cluster | Mutual TLS and service identity |
| Tampering | Compromised container images | Signed images and vulnerability scanning |
| Repudiation | Cloud providers deny actions | Centralized logging with timestamps |
| Information Disclosure | Open storage buckets | Private networks and IAM policies |
| Denial of Service | Resource exhaustion or traffic spikes | Autoscaling and WAF protections |
| Elevation of Privilege | Misconfigured IAM roles | Least-privilege policies and periodic review |

## Collusion Service

See [Anti-Collusion Monitoring](anti-collusion.md) for detailed heuristics and mitigations.

