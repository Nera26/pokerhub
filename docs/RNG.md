# RNG Proof Verification

PokerHub uses a commit–reveal protocol to guarantee fair shuffles. Each hand logs a SHA‑256 commitment for the hidden seed and records every state transition. After showdown the server reveals the seed and nonce.

## CLI verification

Export the hand's proof and log, then run the verifier:

```sh
npm run verify:proof --prefix backend -- <proof.json> <hand-log.jsonl>
```

The command performs three checks:

1. Recomputes `sha256(seed || nonce)` and ensures it matches the published commitment.
2. Recreates the shuffled deck using the revealed seed.
3. Compares the dealt hole cards and remaining deck from the log against the deterministic shuffle.

A success message indicates that the recorded shuffle is consistent with the commitment. Any mismatch aborts with details so auditors can investigate.
