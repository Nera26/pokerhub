# RNG Fairness Protocol

PokerHub uses a commit–reveal scheme to guarantee that each hand is dealt from a deck that players can verify.

## Workflow

1. **Commitment**
   - Before any cards are dealt the server generates a 32-byte random `seed` and a 16-byte `nonce` using `crypto.randomBytes`.
   - It computes `commitment = sha256(seed || nonce)`.
   - The `nonce` and `commitment` are published to all players and appended to `hand-log`.
2. **Shuffle**
   - Cards are shuffled with a deterministic Fisher–Yates algorithm seeded by `seed`.
   - Because the shuffle is deterministic, anyone who knows the seed can reproduce the deck.
3. **Reveal**
   - After the showdown the server reveals the `seed`.
   - The tuple `{ commitment, seed, nonce }` is appended to `hand-log` and stored in the `hand` table.
   - Players can retrieve the proof via `GET /hands/{handId}/proof` or by sending a `proof` event over the `game` WebSocket namespace with `{ handId }`.
   - After fetching the proof, recompute `sha256(seed || nonce)` to verify it matches the earlier commitment, then reproduce the shuffle to confirm the deck.

## Verification CLI

Use `ts-node backend/src/game/verify.ts <seed> <nonce> [commitment]` to verify a hand:

```
node backend/src/game/verify.js 4f..ab 7c..10 9d..00
```

The tool prints the commitment and the deck order produced by the seed. If the optional commitment argument is supplied, the tool checks that it matches the hash of `seed||nonce`.

## Deck Representation

The built-in shuffle uses a numeric deck of 52 cards represented by integers `0–51`. Mapping those integers to card faces is left to the caller.
