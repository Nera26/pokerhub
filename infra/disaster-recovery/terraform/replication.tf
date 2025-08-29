# Cross-region snapshot replication for Postgres and ClickHouse

variable "pg_snapshot_id" {
  description = "Postgres snapshot identifier to copy"
  type        = string
}

# Copy a given Postgres snapshot to the standby region
resource "aws_db_snapshot_copy" "pg_pitr" {
  provider                      = aws.secondary
  source_db_snapshot_identifier = var.pg_snapshot_id
  target_db_snapshot_identifier = "${var.pg_snapshot_id}-copy"
}

# Secondary ClickHouse backup bucket with versioning for PITR
resource "aws_s3_bucket" "clickhouse_backup_dr" {
  provider = aws.secondary
  bucket   = "${var.clickhouse_backup_bucket}-dr"

  versioning {
    enabled = true
  }
}

# Replicate ClickHouse backups to the secondary bucket
resource "aws_s3_bucket_replication_configuration" "clickhouse_pitr" {
  bucket = var.clickhouse_backup_bucket
  role   = aws_iam_role.clickhouse_replication.arn

  rule {
    id     = "pitr"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.clickhouse_backup_dr.arn
      storage_class = "STANDARD"
    }
  }
}
