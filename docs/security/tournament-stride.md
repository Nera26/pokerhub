# Tournament STRIDE Analysis

## Spoofing
- **Threat**: Fake tournament registrations or balancer nodes join the network.
- **Mitigations**: Require signed registration tokens and mutual auth between balancer workers.

## Tampering
- **Threat**: Manipulation of seating assignments or blind levels.
- **Mitigations**: Versioned configs stored in Git, CRC checks before load, and consensus confirmation among balancer nodes.

## Repudiation
- **Threat**: Players dispute elimination or prize distributions.
- **Mitigations**: Persist hand histories and seat movements with cryptographic hashes and publish immutable payout logs.

## Information Disclosure
- **Threat**: Premature exposure of bracket data or hidden player info.
- **Mitigations**: Limit access to active tournament data, scrub spectator views, and encrypt at rest.

## Denial of Service
- **Threat**: Malicious registration floods or worker starvation stalls events.
- **Mitigations**: Throttle sign‑ups per IP, monitor worker heartbeat, and autoscale queue consumers.

## Elevation of Privilege
- **Threat**: Balancer exploits allow unauthorized table control or prize overrides.
- **Mitigations**: Segregate duties between registration and payout services, enforce least privilege, and require code reviews for balancing logic.
