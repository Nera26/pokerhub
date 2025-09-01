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

variable "secondary_region" {
  description = "Secondary GCP region for ops bucket replication"
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

# Ops buckets
variable "spectator_logs_bucket" {
  description = "GCS bucket for spectator logs"
  type        = string
}

variable "spectator_logs_retention_days" {
  description = "Minimum retention period for spectator logs bucket"
  type        = number
  default     = 30
}

variable "spectator_logs_kms_key" {
  description = "KMS key for spectator logs bucket"
  type        = string
  default     = ""
}

variable "proof_archive_bucket" {
  description = "GCS bucket for hand proof archives"
  type        = string
}

variable "proof_archive_retention_days" {
  description = "Minimum retention period for proof archive bucket"
  type        = number
  default     = 365
}

variable "proof_archive_kms_key" {
  description = "KMS key for proof archive bucket"
  type        = string
  default     = ""
}

variable "soak_trends_bucket" {
  description = "GCS bucket for soak test trend logs"
  type        = string
}

variable "soak_trends_retention_days" {
  description = "Minimum retention period for soak trend bucket"
  type        = number
  default     = 30
}

variable "soak_trends_kms_key" {
  description = "KMS key for soak trend bucket"
  type        = string
  default     = ""
}

variable "dr_metrics_bucket" {
  description = "GCS bucket for disaster recovery metrics"
  type        = string
}

variable "dr_metrics_retention_days" {
  description = "Minimum retention period for DR metrics bucket"
  type        = number
  default     = 30
}

variable "dr_metrics_kms_key" {
  description = "KMS key for DR metrics bucket"
  type        = string
  default     = ""
}

