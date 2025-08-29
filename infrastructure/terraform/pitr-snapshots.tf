resource "aws_db_instance_automated_backups_replication" "pitr" {
  provider               = aws.replica
  source_db_instance_arn = aws_db_instance.primary.arn
}
