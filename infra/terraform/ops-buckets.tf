locals {
  ops_buckets = {
    spectator_logs = {
      name           = var.spectator_logs_bucket
      retention_days = var.spectator_logs_retention_days
      kms_key        = var.spectator_logs_kms_key
    }
    proof_archives = {
      name           = var.proof_archive_bucket
      retention_days = var.proof_archive_retention_days
      kms_key        = var.proof_archive_kms_key
    }
    soak_trends = {
      name           = var.soak_trends_bucket
      retention_days = var.soak_trends_retention_days
      kms_key        = var.soak_trends_kms_key
    }
    dr_metrics = {
      name           = var.dr_metrics_bucket
      retention_days = var.dr_metrics_retention_days
      kms_key        = var.dr_metrics_kms_key
    }
  }
}

resource "google_storage_bucket" "ops" {
  for_each = { for k, v in local.ops_buckets : k => v if v.name != "" }
  name     = each.value.name
  location = var.primary_region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  retention_policy {
    retention_period = each.value.retention_days * 86400
  }

  dynamic "encryption" {
    for_each = each.value.kms_key != "" ? [each.value.kms_key] : []
    content {
      default_kms_key_name = encryption.value
    }
  }
}
