# RNG Verification

PokerHub's games rely on a cryptographically secure random number generator. The [RNG Whitepaper](rng-whitepaper.md) describes the architecture and fairness proofs in detail.

## Verification

To independently verify a shuffle:

1. Retrieve the hand's seed and proof from the hand history.
2. Run `verifyProof` from [`shared/verify`](../../shared/verify/index.ts).
3. Confirm the resulting deck order matches the logged hand.

## Test Vectors

Reference test vectors for the RNG implementation are stored in [`vectors.json`](../vectors.json).

