# syntax=docker/dockerfile:1
FROM fsouza/fake-gcs-server:1.52.0

# docker-compose 1.x expects the legacy `ContainerConfig` metadata field to be
# present on the image. Some upstream images (including fake-gcs-server) omit it
# which triggers a KeyError inside docker-compose when recreating services. By
# adding any instruction here (a harmless label) we force BuildKit to create a
# new image config that contains the expected field.
LABEL org.opencontainers.image.source="pokerhub"
