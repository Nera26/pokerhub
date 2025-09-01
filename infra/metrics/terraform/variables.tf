variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "soak_trends_bucket" {
  description = "GCS bucket for raw soak summaries"
  type        = string
}
