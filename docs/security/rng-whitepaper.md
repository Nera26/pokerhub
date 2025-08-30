# RNG Whitepaper

This paper describes PokerHub's random number generation (RNG) system and fairness guarantees.

## Architecture
- CSPRNG seeded from hardware entropy collected at runtime.
- Seeds rotated every game and combined with table-specific salt.

## Fairness Verification
- Game outcomes are streamed to analytics where distribution tests validate uniformity.
- Verification jobs run nightly; results feed the [`rng_fairness`](rng-fairness.md) report.

## Audit
- Quarterly third-party reviews sign off on algorithms and seed handling.
- Historical RNG logs are immutable and retained for seven years.
