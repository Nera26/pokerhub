# RNG Whitepaper

PokerHub uses a commit–reveal protocol to prove every shuffle was fair and unmanipulated.

## Commit Phase
- Server draws a 32‑byte seed and 16‑byte nonce with `crypto.randomBytes`.
- It computes `commitment = sha256(seed || nonce)`.
- The commitment and nonce are broadcast to all seats and logged before any cards are dealt.

## Reveal Phase
- After the hand ends, the seed is published.
- Anyone can recompute `sha256(seed || nonce)` to confirm it matches the original commitment.
- Using the revealed seed, a Fisher–Yates shuffle reproduces the deterministic deck order.

## Verification Steps
1. Fetch `{ seed, nonce, commitment }` from `/hands/{id}/proof`.
2. Verify the hash equality.
3. Shuffle a new deck with the seed and compare against the public hand log.
4. Optional: run `npx ts-node scripts/verify-hand.ts <handId>` to automate steps 1–3.

## Security Guarantees
- Players know the deck order could not be altered post‑deal.
- Observers can archive proofs for independent audits.
- Any mismatch between the commitment and revealed seed proves tampering.

## Revision History
- 2025-01-04: initial public release
