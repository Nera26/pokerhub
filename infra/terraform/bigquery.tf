resource "google_bigquery_dataset" "ops_metrics" {
  dataset_id                  = "ops_metrics"
  location                    = var.primary_region
  description                 = "Operational metrics for soak tests and DR drills"
  default_table_expiration_ms = 90 * 24 * 60 * 60 * 1000
}
