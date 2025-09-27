# syntax=docker/dockerfile:1
FROM grafana/k6:0.48.0

# Compose 1.x requires a populated ContainerConfig. Adding a no-op label forces
# the builder to emit a legacy-compatible image config so volume recreation does
# not explode when the load-testing service is started.
LABEL org.opencontainers.image.source="pokerhub"
