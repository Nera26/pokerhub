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
  region  = var.primary_region
}

resource "google_sql_database_instance" "primary" {
  name             = "${var.db_name}-primary"
  database_version = "POSTGRES_14"
  region           = var.primary_region

  settings {
    tier = var.db_tier
    backup_configuration {
      enabled = true
      retained_backups = var.backup_retention_period
    }
  }

  root_password = var.db_password
}

provider "google" {
  alias   = "replica"
  project = var.project_id
  region  = var.replica_region
}

resource "google_sql_database_instance" "replica" {
  provider            = google.replica
  name                = "${var.db_name}-replica"
  database_version    = google_sql_database_instance.primary.database_version
  region              = var.replica_region
  master_instance_name = google_sql_database_instance.primary.name

  settings {
    tier = var.db_tier
  }
}

resource "google_redis_instance" "redis_primary" {
  name           = "pokerhub-redis"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  region         = var.primary_region
}

provider "google" {
  alias   = "redis_replica"
  project = var.project_id
  region  = var.replica_region
}

resource "google_redis_instance" "redis_replica" {
  provider       = google.redis_replica
  name           = "pokerhub-redis-replica"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  region         = var.replica_region
}
