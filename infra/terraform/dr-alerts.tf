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

