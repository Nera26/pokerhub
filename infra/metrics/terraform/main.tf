terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_bigquery_dataset" "ops_metrics" {
  dataset_id                  = "ops_metrics"
  location                    = var.region
  description                 = "Operational soak test metrics"
  default_table_expiration_ms = 90 * 24 * 60 * 60 * 1000
}

resource "google_bigquery_table" "soak_trends" {
  dataset_id = google_bigquery_dataset.ops_metrics.dataset_id
  table_id   = "soak_trends"

  time_partitioning {
    type = "DAY"
  }
}

resource "google_storage_bucket" "soak_trends_raw" {
  name     = var.soak_trends_bucket
  location = var.region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

output "soak_trends_bucket_name" {
  value = google_storage_bucket.soak_trends_raw.name
}
