# Scheduled backups and cross-region copy

# AWS hourly snapshots with cross-region copy

variable "pg_backup_vault" {
  description = "Name of the primary backup vault"
  type        = string
  default     = "pg-dr-backup"
}

variable "gcp_secondary_region" {
  description = "Secondary GCP region for backup copy"
  type        = string
}

variable "gcp_snapshot_function_url" {
  description = "HTTPS Cloud Function to snapshot and copy the database"
  type        = string
}

data "aws_caller_identity" "current" {}

resource "aws_backup_vault" "pg" {
  name = var.pg_backup_vault
}

resource "aws_backup_vault" "pg_secondary" {
  provider = aws.secondary
  name     = "${var.pg_backup_vault}-secondary"
}

resource "aws_backup_plan" "pg" {
  name = "pg-hourly"

  rule {
    rule_name         = "pg-hourly"
    target_vault_name = aws_backup_vault.pg.name
    schedule          = "cron(0 * * * ? *)"

    copy_action {
      destination_vault_arn = aws_backup_vault.pg_secondary.arn
    }

    lifecycle {
      delete_after = 7
    }
  }
}

resource "aws_iam_role" "backup" {
  name = "pg-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "backup.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_selection" "pg" {
  name         = "pg-selection"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.pg.id
  resources    = ["arn:aws:rds:${var.primary_region}:${data.aws_caller_identity.current.account_id}:db:${var.pg_instance_id}"]
}

# GCP Cloud Scheduler job to trigger snapshot and copy
resource "google_cloud_scheduler_job" "pg_snapshot" {
  name      = "pg-snapshot-copy"
  schedule  = "0 * * * *"
  time_zone = "UTC"

  http_target {
    uri         = "${var.gcp_snapshot_function_url}?region=${var.gcp_secondary_region}"
    http_method = "POST"
  }
}

