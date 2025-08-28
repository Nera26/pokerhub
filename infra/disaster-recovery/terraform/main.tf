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
  provider                     = aws.secondary
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

# CloudWatch rule to trigger nightly restore tests (executed via CronJobs in k8s)
resource "aws_cloudwatch_event_rule" "nightly_restore" {
  name                = "nightly-restore-check"
  schedule_expression = "cron(0 5 * * ? *)"
}
