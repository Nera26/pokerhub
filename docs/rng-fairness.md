# RNG Fairness Whitepaper

**Version:** 1.0.0
**Last Updated:** 2025-08-30

This whitepaper documents the random number generation approach used by PokerHub
and the controls that keep card dealing verifiably fair. The RNG is seeded with
high‑entropy sources, audited by independent firms, and subjected to continuous
statistical testing.

## Seeding Strategy

- The backend combines `crypto.randomBytes` output with entropy from OS sources
  such as `/dev/urandom` and hardware RNGs where available.
- Seeds are rotated for every hand and mixed with a 16‑byte nonce to prevent
  reuse or prediction.
- A server master seed is refreshed on startup and periodically reseeded to
  guard against entropy pool exhaustion.

## Seed and Nonce Generation
- Before a hand starts the server draws a 32‑byte `seed` and 16‑byte `nonce`
  using Node's `crypto.randomBytes`.
- Both values live only in server memory until reveal and are never sent to
  clients mid-hand.

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
npx ts-node shared/verify/index.ts <seed> <nonce> [commitment]
```

3. Recompute `sha256(seed || nonce)` and confirm it matches the published `commitment`.
4. Feed `seed` into the verifier to obtain the deterministic deck order.
5. Parse the JSONL log to reconstruct deals and compare with observed cards to prove fairness.

### CLI verification

A convenience script fetches the hand's proof and log to validate the deck order:

```sh
bin/verify-hand <handId> [baseUrl]
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

### Exporting proof with deck

Auditors can also export the fully reconstructed deck for a hand. The helper
script reads the hand from the database, verifies the commitment and writes a
JSON file under `storage/proofs/<handId>.json` containing the commitment, seed,
nonce and deterministic deck order:

```sh
npx ts-node scripts/export-hand-proof.ts <handId>
```

The script also prints the same object to stdout for quick inspection.

## Independent Audits

PokerHub engages external security firms annually to review the RNG
implementation and reproduce the shuffling process. Audit reports are published
to regulators and summarized for players in transparency reports.

## Statistical Testing

Every release of the RNG library undergoes automated test batteries including:

- Chi‑squared frequency tests
- Runs and serial correlation tests
- Dieharder and NIST SP 800‑22 suites

Results are stored alongside build artifacts and reviewed for regressions. Any
anomalies trigger an engineering investigation before deployment.


## Incident Response

If RNG manipulation or bias is suspected:

1. Pause affected tables and snapshot current `seed` and `nonce` values.
2. Export hand logs and proofs for external verification.
3. Initiate the [Suspected Fraud](./security/incident-response.md#suspected-fraud) workflow.

## Return to Player (RTP)

*Return to Player* measures the proportion of wagered funds that players win
back over time. Because PokerHub offers peer‑to‑peer poker, the theoretical RTP
is close to 100% minus the house rake. The RNG does not manipulate outcomes; it
simply provides an unpredictable deck so that skill and bankroll management
determine results.

- **Cash Games** – RTP = `(total returns to players − rake) / total wagers`.
- **Tournaments** – RTP = `(prize pool / total buy‑ins)` where the prize pool is
  buy‑ins minus fees. Published structures ensure transparency before play
  begins.

Operations reviews RTP reports monthly to confirm that effective returns align
with advertised structures and regulatory expectations.

## Revision History
- 2025-08-30: initial version with commit–reveal protocol and RTP details

