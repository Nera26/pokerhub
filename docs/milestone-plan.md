# Milestone Plan

**Version:** 1.0.0
**Last Updated:** 2025-08-30

This roadmap links major features to their performance and compliance objectives.

| # | Feature | Release Date | Owner | SLO Target | Compliance Goal |
|---|---------|--------------|-------|------------|----------------|
| 1 | Hand Engine v1 | 2025-09-15 | Game Engine Team | 99% action ACKs < 250 ms | Fair dealing via RNG proofs |
| 2 | Socket Reliability | 2025-10-01 | Infrastructure | 99% successful connects | Availability reporting for regulators |
| 3 | RNG Commit–Reveal | 2025-10-15 | Provably Fair Team | 99.95% service uptime | Auditable shuffle integrity |
| 4 | Wallet & Rake | 2025-11-01 | Payments Team | 99.95% service uptime | KYC/AML adherence |
| 5 | Tournament Core | 2025-11-15 | Tournament Team | 99% action ACKs < 250 ms | Transparent payout structures |
| 6 | Leaderboards | 2025-12-01 | Growth Team | 99.95% service uptime | GDPR data export readiness |
| 7 | Observability | 2025-12-15 | SRE Team | 99.95% service uptime | SOC 2 monitoring controls |
| 8 | Scale & Chaos | 2026-01-15 | SRE Team | 99.95% service uptime | Resilience evidence for licensing |

## Implementation Links
- **Milestone 1:** [`backend/src/game`](../backend/src/game)
- **Milestone 2:** [`backend/src/game/game.gateway.ts`](../backend/src/game/game.gateway.ts) and [`load/k6-ws-packet-loss.js`](../load/k6-ws-packet-loss.js)
- **Milestone 3:** [`backend/src/game/rng.ts`](../backend/src/game/rng.ts)
- **Milestone 4:** [`backend/src/wallet`](../backend/src/wallet)
- **Milestone 5:** [`backend/src/tournament`](../backend/src/tournament)
- **Milestone 6:** [`backend/src/leaderboard`](../backend/src/leaderboard)
- **Milestone 7:** [`infrastructure/monitoring`](../infrastructure/monitoring)
- **Milestone 8:** [`load`](../load) and [`docs/runbooks/disaster-recovery.md`](./runbooks/disaster-recovery.md)

## Linked Documents
- [Game Engine Specification](./game-engine-spec.md) – state machine reference for Milestone 1.
- [RNG & RTP Fairness](./rng-fairness.md) – commit–reveal and RTP policies for Milestone 3.
- [Tournament Handbook](./tournament-handbook.md) – formats, payouts, and examples for Milestone 5.
- [Reconciliation Guide](./reconciliation-guide.md) – ledger checks and dispute workflow for Milestone 4.

## Revision History
- 4c23e7c: initial roadmap
- 2025-01-04: link milestones to SLO and compliance goals
- 2025-08-30: add release dates, owners, and version metadata
