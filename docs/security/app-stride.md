# App STRIDE Analysis

## Spoofing
- **Threat**: Attackers forge session cookies or tokens to impersonate users.
- **Mitigations**: Use signed JWTs with short TTLs and verify via centralized auth service; enforce TLS for all client connections.

## Tampering
- **Threat**: Malicious clients alter request payloads or manipulate query params.
- **Mitigations**: Validate input with shared Zod schemas and reject unsigned or unexpected fields; log and alert on schema validation failures.

## Repudiation
- **Threat**: Users deny performing in-app actions or transactions.
- **Mitigations**: Capture immutable audit logs with user IDs, timestamps, and request hashes; expose read-only audit viewer.

## Information Disclosure
- **Threat**: Sensitive profile or game data leaks via unsecured endpoints.
- **Mitigations**: Apply RBAC checks on every route, mask secrets in logs, and run periodic privacy scans.

## Denial of Service
- **Threat**: Flood of requests overloads API or websocket gateway.
- **Mitigations**: Rate‑limit per IP and user, autoscale pods, and circuit‑break external dependencies.

## Elevation of Privilege
- **Threat**: Cross‑site scripting or auth bypass grants higher privileges.
- **Mitigations**: Sanitize all rendered HTML, enforce CSP headers, and require server‑side privilege checks on every request.
