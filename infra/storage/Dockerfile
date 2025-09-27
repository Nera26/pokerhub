# syntax=docker/dockerfile:1

# 1) Pull the upstream binary
FROM fsouza/fake-gcs-server:1.52.0 as upstream

# 2) Small runtime with curl for healthcheck
FROM alpine:3.20
RUN apk add --no-cache ca-certificates curl

# Copy the server binary from the upstream image
COPY --from=upstream /bin/fake-gcs-server /usr/local/bin/fake-gcs-server

EXPOSE 4443
ENTRYPOINT ["/usr/local/bin/fake-gcs-server"]
