# RNG Fairness Protocol

To ensure every deck is provably fair, PokerHub uses a commit–reveal scheme backed by deterministic shuffling.

## Seed Generation
- Before a hand starts the server creates a 32‑byte `seed` and 16‑byte `nonce` via `crypto.randomBytes`.
- The pair is stored in memory and never sent to clients during the hand.

## Commit–Reveal
1. Compute `commitment = sha256(seed || nonce)`.
2. Broadcast `{ commitment, nonce }` to all players and persist it in `hand-log`.
3. Shuffle the deck with a Fisher–Yates algorithm seeded by `seed`.
4. After showdown, reveal `seed` so anyone can verify the shuffle.

## Verification

Players or auditors can reproduce the deck:

```sh
node backend/src/game/verify.js <seed> <nonce> [commitment]
```

1. Recompute `sha256(seed || nonce)` and confirm it matches the published `commitment`.
2. Feed `seed` into the verifier to obtain the deterministic deck order.
3. Compare the deck with cards dealt during the hand to prove fairness.
