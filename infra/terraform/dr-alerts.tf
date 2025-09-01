resource "google_monitoring_alert_policy" "dr_rto_exceeded" {
  display_name = "DR Drill RTO Exceeded"
  combiner     = "OR"

  conditions {
    display_name = "RTO > 1800s"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/dr/rto\" AND resource.type=\"global\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1800
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "dr_rpo_exceeded" {
  display_name = "DR Drill RPO Exceeded"
  combiner     = "OR"

  conditions {
    display_name = "Snapshot RPO > 300s"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/dr/rpo_snapshot\" AND resource.type=\"global\""
      comparison      = "COMPARISON_GT"
      threshold_value = 300
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }

  conditions {
    display_name = "WAL RPO > 300s"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/dr/rpo_wal\" AND resource.type=\"global\""
      comparison      = "COMPARISON_GT"
      threshold_value = 300
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "proof_archive_retention_low" {
  display_name = "Proof Archive Retention Low"
  combiner     = "OR"

  conditions {
    display_name = "Retention days < ${var.proof_archive_retention_days}"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/proof_archive/retention_days\" AND metric.label.bucket=\"${var.proof_archive_bucket}\""
      comparison      = "COMPARISON_LT"
      threshold_value = var.proof_archive_retention_days
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "proof_archive_replication_lag" {
  display_name = "Proof Archive Replication Lag"
  combiner     = "OR"

  conditions {
    display_name = "Replication lag > ${var.proof_archive_replication_lag_threshold_seconds}s"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/proof_archive/replication_lag\" AND metric.label.bucket=\"${var.proof_archive_bucket}\""
      comparison      = "COMPARISON_GT"
      threshold_value = var.proof_archive_replication_lag_threshold_seconds
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}


