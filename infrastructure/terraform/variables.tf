variable "primary_region" {
  description = "AWS region for primary database"
  type        = string
  default     = "us-east-1"
}

variable "replica_region" {
  description = "AWS region for cross-region replica"
  type        = string
  default     = "us-west-2"
}

variable "db_name" {
  description = "Postgres database name prefix"
  type        = string
  default     = "pokerhub"
}

variable "db_username" {
  description = "Master username for Postgres"
  type        = string
}

variable "db_password" {
  description = "Master password for Postgres"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups for PITR"
  type        = number
  default     = 7
}

variable "redis_node_type" {
  description = "Instance type for Redis nodes"
  type        = string
  default     = "cache.t3.micro"
}
