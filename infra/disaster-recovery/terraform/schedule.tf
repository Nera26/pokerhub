variable "gcp_secondary_region" {
  description = "Secondary GCP region for backup copy"
  type        = string
}

variable "snapshot_function_url" {
  description = "HTTPS Cloud Function to snapshot and copy the database"
  type        = string
}

resource "google_cloud_scheduler_job" "pg_snapshot" {
  name      = "pg-snapshot-copy"
  schedule  = "0 * * * *"
  time_zone = "UTC"

  http_target {
    uri         = "${var.snapshot_function_url}?region=${var.gcp_secondary_region}"
    http_method = "POST"
  }
}

