terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
}

resource "aws_db_instance" "primary" {
  identifier          = "${var.db_name}-primary"
  engine              = "postgres"
  instance_class      = "db.m5.large"
  allocated_storage   = 20
  username            = var.db_username
  password            = var.db_password
  backup_retention_period = var.backup_retention_period
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = true
}

provider "aws" {
  alias  = "replica"
  region = var.replica_region
}

resource "aws_db_instance" "replica" {
  provider            = aws.replica
  identifier          = "${var.db_name}-replica"
  engine              = "postgres"
  instance_class      = "db.m5.large"
  replicate_source_db     = aws_db_instance.primary.arn
  backup_retention_period = var.backup_retention_period
  copy_tags_to_snapshot   = true
}

resource "aws_elasticache_replication_group" "redis_cluster" {
  replication_group_id       = "pokerhub-redis"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.redis_node_type
  number_cache_clusters      = 3
  automatic_failover_enabled = true
}

resource "aws_elasticache_global_replication_group" "redis_global" {
  global_replication_group_id_suffix = "pokerhub-redis-global"
  primary_replication_group_id       = aws_elasticache_replication_group.redis_cluster.id
}

resource "aws_elasticache_replication_group" "redis_replica" {
  provider                   = aws.replica
  replication_group_id       = "pokerhub-redis-replica"
  global_replication_group_id = aws_elasticache_global_replication_group.redis_global.global_replication_group_id
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.redis_node_type
  number_cache_clusters      = 3
  automatic_failover_enabled = true
}
