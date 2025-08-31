# Deploy Scripts

These scripts perform canary deployments and rollbacks to GKE.

## Prerequisites

- **Project ID**: export `GCP_PROJECT_ID` or provide it via environment variables/CI `vars`.
- **Authentication**: run `gcloud auth login` locally or use Workload Identity / service account in CI.
- **Roles**: the active identity needs
  - `roles/container.admin` to interact with GKE
  - `roles/cloudbuild.builds.editor` to trigger Cloud Build builds
  - `roles/artifactregistry.reader` and `roles/artifactregistry.writer` to pull/push images
- **Images**: container images are built with Cloud Build and stored in Artifact Registry.

## Usage

These scripts assume that `gcloud container clusters get-credentials` has been executed to set the kubectl context.
