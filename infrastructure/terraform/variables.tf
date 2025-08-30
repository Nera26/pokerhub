variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "primary_region" {
  description = "GCP region for primary Cloud SQL instance"
  type        = string
  default     = "us-central1"
}

variable "replica_region" {
  description = "GCP region for cross-region replica"
  type        = string
  default     = "us-west1"
}

variable "db_name" {
  description = "Cloud SQL instance name prefix"
  type        = string
  default     = "pokerhub"
}

variable "db_password" {
  description = "Root password for Cloud SQL"
  type        = string
  sensitive   = true
}

variable "db_tier" {
  description = "Machine tier for Cloud SQL instances"
  type        = string
  default     = "db-custom-1-3840"
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "redis_tier" {
  description = "Service tier for Memorystore Redis"
  type        = string
  default     = "STANDARD_HA"
}

variable "redis_memory_size_gb" {
  description = "Memory size for Redis in GB"
  type        = number
  default     = 1
}
