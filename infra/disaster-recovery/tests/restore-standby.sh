#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"

metrics_file="restore-standby.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

snap_ts=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --region "$SECONDARY_REGION" \
  --query 'DBSnapshots[0].SnapshotCreateTime' --output text)
snap_epoch=$(date -d "$snap_ts" +%s)

rpo=$((start_epoch - snap_epoch))
echo "RPO_SECONDS=$rpo" >> "$metrics_file"

standby_id="dr-standby-$start_epoch"
export STANDBY_IDENTIFIER="$standby_id"

restore_start=$(date +%s)
SECONDARY_REGION="$SECONDARY_REGION" PG_SNAPSHOT_ID="$PG_SNAPSHOT_ID" PROMOTE=true STANDBY_IDENTIFIER="$standby_id" ../restore-standby.sh
restore_end=$(date +%s)

rto=$((restore_end - start_epoch))
echo "RTO_SECONDS=$rto" >> "$metrics_file"

end_iso=$(date --iso-8601=seconds)
echo "END_TIME=$end_iso" >> "$metrics_file"

if (( rto > 1800 )); then
  echo "Restore time ${rto}s exceeds 30min" >&2
  exit 1
fi

if (( rpo > 300 )); then
  echo "Data loss window ${rpo}s exceeds 5min" >&2
  exit 1
fi

echo "Restore and promotion completed in ${rto}s with data loss ${rpo}s"

aws rds delete-db-instance \
  --db-instance-identifier "$standby_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true
