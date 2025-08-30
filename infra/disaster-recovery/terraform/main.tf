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
  description = "Primary Cloud SQL instance name"
  type        = string
}

variable "redis_instance_name" {
  description = "Primary Memorystore Redis instance name"
  type        = string
}

variable "redis_snapshot_bucket_name" {
  description = "GCS bucket storing Redis snapshots"
  type        = string
}

variable "clickhouse_backup_bucket_name" {
  description = "GCS bucket storing ClickHouse backups"
  type        = string
}

variable "wal_archive_bucket_name" {
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

# Create a manual backup of the primary Cloud SQL instance
resource "google_sql_backup_run" "pg" {
  instance = var.pg_instance_name
}

# Cross-region read replica for Postgres with PITR enabled
resource "google_sql_database_instance" "pg_replica" {
  provider             = google.secondary
  name                 = "${var.pg_instance_name}-dr"
  database_version     = "POSTGRES_15"
  region               = var.secondary_region
  master_instance_name = var.pg_instance_name

  settings {
    tier = "db-custom-1-3840"
  }
}

# Memorystore Redis primary instance
resource "google_redis_instance" "redis" {
  name           = var.redis_instance_name
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  region         = var.primary_region
}

# Buckets for Redis snapshots with versioning
resource "google_storage_bucket" "redis_snapshots" {
  name     = var.redis_snapshot_bucket_name
  location = var.primary_region

  versioning { enabled = true }
}

resource "google_storage_bucket" "redis_snapshots_dr" {
  provider = google.secondary
  name     = "${var.redis_snapshot_bucket_name}-dr"
  location = var.secondary_region

  versioning { enabled = true }
}

# ClickHouse backup bucket replica with versioning for PITR
resource "google_storage_bucket" "clickhouse_replica" {
  provider = google.secondary
  name     = "${var.clickhouse_backup_bucket_name}-dr"
  location = var.secondary_region

  versioning { enabled = true }
}

# Postgres WAL archive bucket with replication to secondary region
resource "google_storage_bucket" "pg_wal_archive" {
  name     = var.wal_archive_bucket_name
  location = var.primary_region

  versioning { enabled = true }

  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 7 }
  }
}

resource "google_storage_bucket" "pg_wal_archive_dr" {
  provider = google.secondary
  name     = "${var.wal_archive_bucket_name}-dr"
  location = var.secondary_region

  versioning { enabled = true }
}

# Transfer jobs to replicate data between buckets
resource "google_storage_transfer_job" "redis_replication" {
  project     = var.project_id
  description = "Replicate Redis snapshots to DR"

  transfer_spec {
    gcs_data_source { bucket_name = google_storage_bucket.redis_snapshots.name }
    gcs_data_sink { bucket_name = google_storage_bucket.redis_snapshots_dr.name }
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

resource "google_storage_transfer_job" "pg_wal_replication" {
  project     = var.project_id
  description = "Replicate Postgres WAL to DR"

  transfer_spec {
    gcs_data_source { bucket_name = google_storage_bucket.pg_wal_archive.name }
    gcs_data_sink { bucket_name = google_storage_bucket.pg_wal_archive_dr.name }
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

# Transfer job to replicate ClickHouse backups
resource "google_storage_transfer_job" "clickhouse_replication" {
  project     = var.project_id
  description = "Replicate ClickHouse backups to DR"

  transfer_spec {
    gcs_data_source { bucket_name = var.clickhouse_backup_bucket_name }
    gcs_data_sink { bucket_name = google_storage_bucket.clickhouse_replica.name }
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

