provider "aws" {
  alias  = "restore"
  region = var.restore_region
}

resource "aws_db_instance" "restore" {
  count                = var.restore_snapshot_id != "" ? 1 : 0
  provider             = aws.restore
  identifier           = "${var.db_name}-restore"
  snapshot_identifier  = var.restore_snapshot_id
  instance_class       = var.restore_instance_class
  skip_final_snapshot  = true
}
