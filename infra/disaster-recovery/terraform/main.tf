terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_region" {
  description = "Region to copy snapshots to"
  type        = string
}

variable "pg_instance_id" {
  description = "Primary Postgres instance identifier"
  type        = string
}

variable "redis_cluster_id" {
  description = "Primary Redis cluster identifier"
  type        = string
}

variable "clickhouse_backup_bucket" {
  description = "S3 bucket storing ClickHouse backups"
  type        = string
}

variable "wal_archive_bucket" {
  description = "S3 bucket for Postgres WAL archive"
  type        = string
}

provider "aws" {
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

resource "aws_db_snapshot" "pg" {
  db_instance_identifier = var.pg_instance_id
  db_snapshot_identifier = "pg-dr-snapshot"
}

resource "aws_db_snapshot_copy" "pg_copy" {
  provider                      = aws.secondary
  source_db_snapshot_identifier = aws_db_snapshot.pg.arn
  target_db_snapshot_identifier = "pg-dr-snapshot-copy"
}

resource "aws_elasticache_snapshot" "redis" {
  replication_group_id = var.redis_cluster_id
  snapshot_name        = "redis-dr-snapshot"
}

resource "aws_s3_bucket" "redis_snapshots" {
  provider = aws.secondary
  bucket   = "redis-dr-snapshots"
}

resource "aws_s3_bucket_object" "redis_copy" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.redis_snapshots.id
  key      = "${aws_elasticache_snapshot.redis.snapshot_name}.rdb"
  source   = aws_elasticache_snapshot.redis.snapshot_name
}

# Cross-region read replica for Postgres with PITR enabled
resource "aws_db_instance" "pg_replica" {
  provider                = aws.secondary
  identifier              = "pg-dr-replica"
  replicate_source_db     = var.pg_instance_id
  instance_class          = "db.t3.micro"
  publicly_accessible     = false
  backup_retention_period = 7
  parameter_group_name    = aws_db_parameter_group.pg_wal.name
}

# ClickHouse backup bucket replica with versioning for PITR
resource "aws_s3_bucket" "clickhouse_replica" {
  provider = aws.secondary
  bucket   = "${var.clickhouse_backup_bucket}-dr"

  versioning {
    enabled = true
  }
}

resource "aws_iam_role" "clickhouse_replication" {
  name = "clickhouse-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "s3.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "clickhouse_replication" {
  role = aws_iam_role.clickhouse_replication.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:*"],
      Resource = [
        "arn:aws:s3:::${var.clickhouse_backup_bucket}",
        "arn:aws:s3:::${var.clickhouse_backup_bucket}/*",
        aws_s3_bucket.clickhouse_replica.arn,
        "${aws_s3_bucket.clickhouse_replica.arn}/*"
      ]
    }]
  })
}

# Postgres WAL archive bucket with replication to secondary region
resource "aws_s3_bucket" "pg_wal_archive" {
  bucket = var.wal_archive_bucket

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "expire-wals"
    enabled = true

    expiration {
      days = 7
    }
  }
}

resource "aws_s3_bucket" "pg_wal_archive_dr" {
  provider = aws.secondary
  bucket   = "${var.wal_archive_bucket}-dr"

  versioning {
    enabled = true
  }
}

resource "aws_iam_role" "pg_wal_replication" {
  name = "pg-wal-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "s3.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "pg_wal_replication" {
  role = aws_iam_role.pg_wal_replication.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:*"],
      Resource = [
        aws_s3_bucket.pg_wal_archive.arn,
        "${aws_s3_bucket.pg_wal_archive.arn}/*",
        aws_s3_bucket.pg_wal_archive_dr.arn,
        "${aws_s3_bucket.pg_wal_archive_dr.arn}/*"
      ]
    }]
  })
}

resource "aws_s3_bucket_replication_configuration" "pg_wal" {
  bucket = aws_s3_bucket.pg_wal_archive.id
  role   = aws_iam_role.pg_wal_replication.arn

  rule {
    id     = "wal-dr-replica"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.pg_wal_archive_dr.arn
      storage_class = "STANDARD"
    }
  }
}

resource "aws_db_parameter_group" "pg_wal" {
  name   = "pg-wal-archive"
  family = "postgres15"

  parameter {
    name  = "archive_mode"
    value = "on"
  }

  parameter {
    name  = "archive_command"
    value = "aws s3 cp %p s3://${var.wal_archive_bucket}/%f"
  }
}

resource "aws_s3_bucket_replication_configuration" "clickhouse" {
  bucket = var.clickhouse_backup_bucket
  role   = aws_iam_role.clickhouse_replication.arn

  rule {
    id     = "dr-replica"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.clickhouse_replica.arn
      storage_class = "STANDARD"
    }
  }
}

# CloudWatch rule to trigger nightly restore tests (executed via CronJobs in k8s)
resource "aws_cloudwatch_event_rule" "nightly_restore" {
  name                = "nightly-restore-check"
  schedule_expression = "cron(0 5 * * ? *)"
}
