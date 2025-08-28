terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.9"
    }
  }
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig
  }
}

variable "kubeconfig" {
  description = "Path to kubeconfig file"
  type        = string
}

resource "helm_release" "clickhouse" {
  name       = "clickhouse"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "clickhouse"
  version    = "4.0.3"
  values     = [file("${path.module}/../helm/values.yaml")]
}
