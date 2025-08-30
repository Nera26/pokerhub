terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "primary_region" {
  description = "Primary GCP region"
  type        = string
}

variable "secondary_region" {
  description = "Secondary GCP region for DR"
  type        = string
}

variable "pg_instance_name" {
  description = "Name of the primary Cloud SQL instance"
  type        = string
}

variable "wal_bucket_name" {
  description = "GCS bucket for Postgres WAL archive"
  type        = string
}

provider "google" {
  project = var.project_id
  region  = var.primary_region
}

provider "google" {
  alias   = "secondary"
  project = var.project_id
  region  = var.secondary_region
}

# WAL archive bucket with cross-region replication
resource "google_storage_bucket" "wal" {
  name     = var.wal_bucket_name
  location = var.primary_region

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket" "wal_dr" {
  provider = google.secondary
  name     = "${var.wal_bucket_name}-dr"
  location = var.secondary_region

  versioning {
    enabled = true
  }
}

# Transfer job to copy WAL archives to the DR bucket
resource "google_storage_transfer_job" "wal_replication" {
  project     = var.project_id
  description = "Replicate WAL archives to DR bucket"

  transfer_spec {
    gcs_data_source { bucket_name = google_storage_bucket.wal.name }
    gcs_data_sink { bucket_name = google_storage_bucket.wal_dr.name }
  }

  schedule {
    schedule_start_date {
      year  = 2024
      month = 1
      day   = 1
    }
    start_time_of_day {
      hours   = 1
      minutes = 0
      seconds = 0
      nanos   = 0
    }
  }
}

# Read replica in secondary region for rapid promotion
resource "google_sql_database_instance" "replica" {
  provider             = google.secondary
  name                 = "${var.pg_instance_name}-dr"
  database_version     = "POSTGRES_15"
  region               = var.secondary_region
  master_instance_name = var.pg_instance_name

  settings {
    tier = "db-custom-1-3840"
  }
}

