# Ops Buckets

The Terraform module under `infra/terraform/ops-buckets.tf` provisions the
Google Cloud Storage buckets used by operations automation:

- **Spectator logs**
- **Proof archives**
- **Soak trends**
- **Disaster recovery metrics**

Each bucket enforces uniform bucket-level access, object versioning and a
minimum retention policy. Buckets can optionally use a customer‑managed KMS key
for encryption.

## Provisioning

```bash
cd infra/terraform
terraform init
export TF_VAR_spectator_logs_bucket="<logs-bucket>"
export TF_VAR_spectator_logs_retention_days=30
export TF_VAR_spectator_logs_kms_key="projects/<proj>/locations/<loc>/keyRings/<ring>/cryptoKeys/<key>"
# repeat for proof_archive, soak_trends and dr_metrics
terraform plan
terraform apply
```

Operators should update the `TF_VAR_*` values when rotating bucket names,
retention periods or KMS keys and re-run `terraform apply`.
