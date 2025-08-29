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
  description = "Secondary AWS region for DR"
  type        = string
}

variable "pg_instance_id" {
  description = "Identifier of the primary Postgres instance"
  type        = string
}

variable "wal_bucket" {
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

# WAL archive bucket with cross-region replication
resource "aws_s3_bucket" "wal" {
  bucket = var.wal_bucket

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "wal_dr" {
  provider = aws.secondary
  bucket   = "${var.wal_bucket}-dr"

  versioning {
    enabled = true
  }
}

resource "aws_iam_role" "wal_replication" {
  name = "wal-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "wal_replication" {
  role = aws_iam_role.wal_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow",
      Action   = ["s3:*"],
      Resource = [
        aws_s3_bucket.wal.arn,
        "${aws_s3_bucket.wal.arn}/*",
        aws_s3_bucket.wal_dr.arn,
        "${aws_s3_bucket.wal_dr.arn}/*"
      ]
    }]
  })
}

resource "aws_s3_bucket_replication_configuration" "wal" {
  bucket = aws_s3_bucket.wal.id
  role   = aws_iam_role.wal_replication.arn

  rule {
    id     = "wal-dr"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.wal_dr.arn
      storage_class = "STANDARD"
    }
  }
}

# Read replica in secondary region for rapid promotion
resource "aws_db_instance" "replica" {
  provider            = aws.secondary
  identifier          = "${var.pg_instance_id}-dr"
  replicate_source_db = var.pg_instance_id
  instance_class      = "db.t3.micro"
  publicly_accessible = false
  backup_retention_period = 7
}
