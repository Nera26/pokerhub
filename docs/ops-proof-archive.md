# Proof Archive Guardrail

Any workflow that interacts with production data must verify recent proof archives.
Reuse the shared workflow to ensure the latest archive exists and meets retention policy.

```yaml
jobs:
  ensure-proof-archive:
    if: ${{ always() }}
    uses: ./.github/workflows/ensure-proof-archive.yml
    secrets: inherit
  deploy:
    needs: ensure-proof-archive
    # ...
```

Include this job and list it under `needs` for any job that reads or writes production
data. The step fails if the most recent archive is missing or retention has lapsed,
preventing the workflow from continuing until the archive is healthy.
