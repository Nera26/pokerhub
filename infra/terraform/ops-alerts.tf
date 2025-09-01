resource "google_monitoring_alert_policy" "spectator_privacy_missing" {
  display_name = "Spectator Privacy Job Missing"
  combiner     = "OR"

  conditions {
    display_name = "No run_success metric for ${var.spectator_privacy_absence_minutes}m"
    condition_absent {
      filter   = "metric.type=\"custom.googleapis.com/spectator_privacy/run_success\" AND metric.label.bucket=\"${var.spectator_logs_bucket}\""
      duration = "${var.spectator_privacy_absence_minutes * 60}s"
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "soak_latency_high" {
  display_name = "Soak Latency High"
  combiner     = "OR"

  conditions {
    display_name = "Latency > ${var.soak_latency_threshold_ms}ms"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/soak/latency\" AND metric.label.bucket=\"${var.soak_trends_bucket}\""
      comparison      = "COMPARISON_GT"
      threshold_value = var.soak_latency_threshold_ms
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "soak_throughput_low" {
  display_name = "Soak Throughput Low"
  combiner     = "OR"

  conditions {
    display_name = "Throughput < ${var.soak_throughput_threshold}"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/soak/throughput\" AND metric.label.bucket=\"${var.soak_trends_bucket}\""
      comparison      = "COMPARISON_LT"
      threshold_value = var.soak_throughput_threshold
      duration        = "0s"
      trigger {
        count = 1
      }
    }
  }
}
