# syntax=docker/dockerfile:1
FROM fsouza/fake-gcs-server:1.47.5

# Wrapper image for docker-compose compatibility.
# docker-compose.yml passes runtime flags (e.g. "-scheme http -backend memory").
LABEL org.opencontainers.image.source="https://github.com/Nera26/pokerhub"
