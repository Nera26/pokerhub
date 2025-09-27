# syntax=docker/dockerfile:1
FROM fsouza/fake-gcs-server:1.52.0

# Wrapper image for docker-compose compatibility.
# docker-compose.yml passes runtime flags (e.g., "-scheme http -backend memory").
# Adding a label forces a new image config so older docker-compose won't KeyError on ContainerConfig.
LABEL org.opencontainers.image.source="https://github.com/Nera26/pokerhub"
