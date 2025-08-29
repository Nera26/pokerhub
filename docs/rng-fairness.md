# RNG Fairness Protocol

To ensure every deck is provably fair, PokerHub uses a commit–reveal scheme backed by deterministic shuffling.

## Seed and Nonce Generation
- Before a hand starts the server draws a 32‑byte `seed` and 16‑byte `nonce` using Node's `crypto.randomBytes`.
- Both values live only in server memory until reveal and are never sent to clients mid-hand.

## Commit–Reveal
1. Compute `commitment = sha256(seed || nonce)`.
2. Broadcast `{ commitment, nonce }` to all players and persist it in `hand-log`.
3. Shuffle the deck with a Fisher–Yates algorithm seeded by `seed`.
4. After showdown, reveal `seed` and append the proof to the hand log so anyone can verify the shuffle.

## Fetching the Proof

The server persists the trio `{ commitment, seed, nonce }` for each hand. After the hand ends it can be
retrieved via the API:

```http
GET /hands/{id}/proof -> { seed, nonce, commitment }
```

Clients such as the Fairness modal call this endpoint and validate the response locally with `verifyProof`.

## Verification

To validate a hand, clients repeat the server's steps:

1. Fetch `{ seed, nonce, commitment }` from `/hands/{id}/proof`.
2. Recompute `sha256(seed || nonce)` and ensure it equals `commitment`.
3. Shuffle a fresh deck with the same Fisher–Yates algorithm seeded by `seed`.
4. Replay the hand log against this deck to prove cards were dealt deterministically.

After showdown the table displays **Verify Hand** and **Download Proof** links. The
first opens a modal with the hand's seed, nonce and commitment, while the latter
lets players save the proof JSON for offline checks.

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

### CLI verification

A convenience script fetches the hand log, extracts the embedded proof and checks the deck order:

```sh
npx ts-node scripts/verify-hand.ts <handId> [baseUrl]
```

It verifies the commitment and asserts that the recorded deck matches the
shuffle derived from the revealed seed.

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
