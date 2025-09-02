variable "restore_region" {
  description = "GCP region to restore the instance in"
  type        = string
}

variable "restore_backup_id" {
  description = "Backup run ID to restore from"
  type        = string
  default     = ""
}

variable "restore_instance_tier" {
  description = "Machine tier for the temporary restore instance"
  type        = string
  default     = "db-custom-1-3840"
}

resource "google_sql_database_instance" "restore" {
  count            = var.restore_backup_id != "" ? 1 : 0
  name             = "${var.db_name}-restore"
  region           = var.restore_region
  database_version = google_sql_database_instance.primary.database_version

  settings {
    tier = var.restore_instance_tier
  }

  restore_backup_context {
    backup_run_id = var.restore_backup_id
    instance_id   = google_sql_database_instance.primary.name
  }
}

