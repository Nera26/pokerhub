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

After showdown the table displays a **Verify Hand** link. Clicking it opens a modal
with the hand's seed, nonce and commitment.

![Hand proof modal](./images/hand-proof-modal.svg)

1. After showdown, click **Verify Hand**.
2. Review the seed, nonce and commitment in the dialog.
3. Press **Verify** to recompute the deck locally and reveal the deterministic order.
4. Use the "Open verifier" link for manual inspection in a new tab if desired.

### Manual verification

Players or auditors can reproduce the deck independently:

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

### Exporting proofs via CLI

For convenience a CLI is available to dump the proof for a specific hand.

1. Install the backend package dependencies:

   ```sh
   cd backend
   npm install
   ```

2. Export the proof for a hand ID:

   ```sh
   npx export-proofs <handId>
   ```

   The command prints a JSON object containing the `seed`, `nonce` and `commitment` for the hand.
