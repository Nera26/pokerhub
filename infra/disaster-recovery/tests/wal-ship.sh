#!/usr/bin/env bash
set -euo pipefail

: "${WAL_ARCHIVE_BUCKET:?Must set WAL_ARCHIVE_BUCKET}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

wal_dir=${PG_WAL_DIR:-/var/lib/postgresql/data/pg_wal}
log "Shipping WAL segments from $wal_dir to s3://${WAL_ARCHIVE_BUCKET}"

find "$wal_dir" -type f -mmin -5 | while read -r wal; do
  aws s3 cp "$wal" "s3://${WAL_ARCHIVE_BUCKET}/$(basename "$wal")" >/dev/null
done

log "WAL shipping complete"

