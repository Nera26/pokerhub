resource "aws_s3_bucket" "redis_snapshots_dr" {
  provider = aws.secondary
  bucket   = "${var.redis_snapshot_bucket}-dr"

  versioning {
    enabled = true
  }
}

resource "aws_iam_role" "redis_replication" {
  name = "redis-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "s3.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "redis_replication" {
  role = aws_iam_role.redis_replication.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:*"],
      Resource = [
        aws_s3_bucket.redis_snapshots.arn,
        "${aws_s3_bucket.redis_snapshots.arn}/*",
        aws_s3_bucket.redis_snapshots_dr.arn,
        "${aws_s3_bucket.redis_snapshots_dr.arn}/*"
      ]
    }]
  })
}

resource "aws_s3_bucket_replication_configuration" "redis" {
  bucket = aws_s3_bucket.redis_snapshots.id
  role   = aws_iam_role.redis_replication.arn

  rule {
    id     = "redis-dr-replica"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.redis_snapshots_dr.arn
      storage_class = "STANDARD"
    }
  }
}
