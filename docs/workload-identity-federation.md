# GitHub Actions Workload Identity Federation

GitHub workflows authenticate to Google Cloud without long‑lived service account keys. Instead, they use [Workload Identity Federation](https://github.com/google-github-actions/auth#workload-identity-federation) to exchange GitHub's OIDC tokens for short‑lived credentials.

## Setup

1. Create a workload identity pool and provider in Google Cloud.
2. Grant the provider permission to impersonate the desired service account.
3. In this repository, define the following variables:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER` – full resource name of the provider.
   - `GCP_SERVICE_ACCOUNT` – email of the service account to impersonate.

## Usage

Workflows authenticate with these variables:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
```

The `GCP_SA_KEY` secret is no longer required and has been removed.
