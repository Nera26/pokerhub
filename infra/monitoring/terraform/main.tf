terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.11.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.22.0"
    }
  }
}

variable "kubeconfig" {
  description = "Path to the kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "pagerduty_routing_key" {
  description = "PagerDuty Events API v2 routing key"
  type        = string
}

provider "kubernetes" {
  config_path = var.kubeconfig
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig
  }
}

resource "kubernetes_config_map" "business_dashboards" {
  metadata {
    name = "business-dashboard"
  }

  data = {
    "business.json" = file("${path.module}/dashboards/business.json")
  }
}

resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  version    = "8.0.0"

  values = [yamlencode({
    dashboardProviders = {
      "dashboardproviders.yaml" = {
        apiVersion = 1
        providers = [{
          name                    = "default"
          orgId                   = 1
          folder                  = ""
          type                    = "file"
          disableDeletion         = false
          updateIntervalSeconds   = 30
          options = {
            path = "/var/lib/grafana/dashboards"
          }
        }]
      }
    }
    dashboardsConfigMaps = {
      default = kubernetes_config_map.business_dashboards.metadata[0].name
    }
  })]
}

resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  version    = "25.0.0"

  values = [templatefile("${path.module}/prometheus-values.yaml", {
    pagerduty_routing_key = var.pagerduty_routing_key
  })]
}
