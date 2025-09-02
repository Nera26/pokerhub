resource "google_sql_backup_run" "pitr" {
  instance = google_sql_database_instance.primary.name
}

