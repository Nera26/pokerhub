# RNG Fairness Protocol

To ensure every deck is provably fair, PokerHub uses a commit–reveal scheme backed by deterministic shuffling.

## Seed Generation
- Before a hand starts the server creates a 32‑byte `seed` and 16‑byte `nonce` via `crypto.randomBytes`.
- The pair is stored in memory and never sent to clients during the hand.

## Commit–Reveal
1. Compute `commitment = sha256(seed || nonce)`.
2. Broadcast `{ commitment, nonce }` to all players and persist it in `hand-log`.
3. Shuffle the deck with a Fisher–Yates algorithm seeded by `seed`.
4. After showdown, reveal `seed` and append the proof to the hand log so anyone can verify the shuffle.

## Verification

Players or auditors can reproduce the deck:

1. Fetch the hand log and proof after the hand ends:

```sh
curl /hands/<handId>/log   # JSONL entries
curl /hands/<handId>/proof # { seed, nonce, commitment }
```

2. Run the verifier with the returned values:

```sh
npx ts-node backend/src/game/verify.ts <seed> <nonce> [commitment]
```

3. Recompute `sha256(seed || nonce)` and confirm it matches the published `commitment`.
4. Feed `seed` into the verifier to obtain the deterministic deck order.
5. Parse the JSONL log to reconstruct deals and compare with observed cards to prove fairness.
