# RNG Whitepaper

This paper describes PokerHub's random number generation (RNG) system and fairness guarantees.

## Architecture
- CSPRNG seeded from hardware entropy collected at runtime.
- Seeds rotated every game and combined with table-specific salt.
- [HandRNG](../../backend/src/game/rng.ts) uses a commit-reveal protocol with SHA-256 to shuffle decks deterministically.

## Fairness Verification
- Game outcomes are streamed to analytics where distribution tests validate uniformity.
- Verification jobs run nightly; results feed the [`rng_fairness`](rng-fairness.md) report.
 - Players can independently verify shuffles using `verifyProof` from [shared/verify](../../shared/verify/index.ts).

## Audit
- Quarterly third-party reviews sign off on algorithms and seed handling.
- Historical RNG logs are immutable and retained for seven years.
