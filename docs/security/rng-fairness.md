# RNG Fairness

PokerHub employs a commit–reveal scheme to ensure every shuffle can be independently verified.

## Key Modules
- `backend/src/game/rng.ts` – implements `HandRNG` with SHA‑256 commitments and deterministic Fisher–Yates shuffling.
- `backend/src/game/verify.ts` – CLI verifier that rebuilds decks and checks commitments.

## Commit–Reveal Flow
1. Server draws a 32‑byte seed and 16‑byte nonce.
2. `commitment = sha256(seed || nonce)` is broadcast with the nonce before cards are dealt.
3. After the hand ends, the seed is revealed so anyone can recompute the deck.

## Provable Fairness Checks
1. Fetch `{ seed, nonce, commitment }` via `GET /hands/{id}/proof`.
2. Run `npx ts-node backend/src/game/verify.ts <seedHex> <nonceHex> [commitment]`.
3. The script recomputes the commitment and deterministic deck. Any mismatch signals tampering.

## Audit Trail
Proofs are stored alongside hand logs under `storage/proofs/` and hashed into a nightly Merkle root for regulators.
