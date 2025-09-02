# RNG Verification

PokerHub's games rely on a cryptographically secure random number generator. The [RNG Whitepaper](rng-whitepaper.md) describes the architecture and fairness proofs in detail.

## Verification

To independently verify a shuffle:

1. Retrieve the hand's seed and proof from the hand history.
2. Run `verifyProof` in [`backend/src/game/rng.ts`](../../backend/src/game/rng.ts).
3. Confirm the resulting deck order matches the logged hand.

## Test Vectors

Reference test vectors for the RNG implementation are stored in [`backend/services/random/test/vectors.json`](../../backend/services/random/test/vectors.json).

