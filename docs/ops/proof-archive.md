# Proof Archive Audit

The proof archive workflow emits a `proof-summary.json` describing each batch of hand proofs. The summary is signed with a dedicated Cloud KMS key and the signed manifest is stored in a write-once bucket for auditing.

## Replication

- The proof archive bucket (`$PROOF_ARCHIVE_BUCKET`) must be dual-region and replicate data to `$SECONDARY_REGION` for disaster recovery.
- The `scripts/check-proof-archive-replication.ts` script verifies this configuration via `gcloud storage buckets describe`.

## Signed manifest

- **Bucket**: `gs://$PROOF_MANIFEST_BUCKET` (object versioning or WORM enabled)
- **Manifest URI**: `gs://$PROOF_MANIFEST_BUCKET/latest/manifest.json`
- **Summary URI**: `gs://$PROOF_MANIFEST_BUCKET/latest/proof-summary.json`
- Manifest fields:
  - `sha256` – SHA256 digest of `proof-summary.json`
  - `signature` – base64-encoded KMS signature of the summary

### Verification

```bash
# download artifacts
gcloud storage cp gs://$PROOF_MANIFEST_BUCKET/latest/proof-summary.json summary.json
gcloud storage cp gs://$PROOF_MANIFEST_BUCKET/latest/manifest.json manifest.json

# verify signature
jq -r '.signature' manifest.json | base64 -d > signature.bin
gcloud kms asymmetric-signature verify \
  --key=$PROOF_MANIFEST_KMS_KEY \
  --keyring=$PROOF_MANIFEST_KMS_KEYRING \
  --location=$PROOF_MANIFEST_KMS_LOCATION \
  --version=$PROOF_MANIFEST_KMS_VERSION \
  --plaintext-file=summary.json \
  --signature-file=signature.bin
```

## Audit log

| Date       | Manifest URI                                   | Signature            |
|------------|------------------------------------------------|----------------------|
| YYYY-MM-DD | `gs://$PROOF_MANIFEST_BUCKET/YYYY-MM-DD/manifest.json` | `<base64 signature>` |
