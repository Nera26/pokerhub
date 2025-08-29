# Threat Model

STRIDE analysis for core PokerHub components.

## Authentication
- **Spoofing**: Attackers reuse or forge credentials. *Mitigation:* short-lived JWTs, refresh rotation, and optional MFA.
- **Tampering**: Tokens or session cookies altered to gain access. *Mitigation:* HMAC-signed tokens validated server-side and HTTP-only cookies.
- **Repudiation**: Users deny login or logout events. *Mitigation:* append-only auth logs with timestamped entries.
- **Information Disclosure**: Credential leaks or session hijacking. *Mitigation:* TLS everywhere and same-site cookies prevent interception.
- **Denial of Service**: Credential stuffing or login floods. *Mitigation:* per-IP rate limits and exponential backoff.
- **Elevation of Privilege**: Compromised accounts acting as admins. *Mitigation:* role-based access checks on every request.

## Wallet
- **Spoofing**: Forged transfer requests. *Mitigation:* signed API calls tied to the session and second-factor approval for withdrawals.
- **Tampering**: Manipulating journal entries to alter balances. *Mitigation:* immutable double-entry ledger with checksums.
- **Repudiation**: Users deny sending or receiving funds. *Mitigation:* non-repudiation via signed receipts and audit trails.
- **Information Disclosure**: Leak of wallet balances or addresses. *Mitigation:* encrypt sensitive fields at rest and restrict API scopes.
- **Denial of Service**: Flood of tiny transfers to exhaust processing. *Mitigation:* velocity limits and queue back-pressure.
- **Elevation of Privilege**: Bypassing withdrawal limits. *Mitigation:* server-side validation of limits and admin-only override paths.

## Game
- **Spoofing**: Clients masquerade as other players. *Mitigation:* session-bound socket authentication.
- **Tampering**: Altering action packets or RNG state. *Mitigation:* server-authoritative game engine and integrity-checked messages.
- **Repudiation**: Players dispute past moves. *Mitigation:* append-only hand logs linked to user IDs.
- **Information Disclosure**: Leaking hole cards or internal state. *Mitigation:* send per-player data over encrypted channels only.
- **Denial of Service**: Spamming actions or opening many tables. *Mitigation:* websocket rate limits and connection caps.
- **Elevation of Privilege**: Forging admin/game-manager commands. *Mitigation:* strict server-side role checks before executing control actions.

## Tournaments
- **Spoofing**: Fake registrations or seat claims. *Mitigation:* entry requires authenticated wallet payment.
- **Tampering**: Modifying brackets or payout structures. *Mitigation:* tournament definitions signed and stored server-side.
- **Repudiation**: Players dispute eliminations or prizes. *Mitigation:* immutable event logs and published payout proofs.
- **Information Disclosure**: Exposure of opponent stats or private notes. *Mitigation:* access control layers and data minimisation.
- **Denial of Service**: Mass registration or stalling to freeze events. *Mitigation:* registration caps and per-round action timers.
- **Elevation of Privilege**: Unauthorized alteration of tournament rules. *Mitigation:* admin console protected by RBAC and audit.
