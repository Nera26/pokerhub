#!/usr/bin/env bash
set -euo pipefail
summary="$1"

# Extract metrics from summary
latency_p95=$(jq -r '.metrics.ack_latency["p(95)"] // 0' "$summary")
error_rate=$(jq -r '.metrics.error_rate.rate // 0' "$summary" 2>/dev/null || echo 0)
cpu=$(jq -r '.metrics.cpu_usage.avg // 0' "$summary" 2>/dev/null || echo 0)
gc_p95=$(jq -r '.metrics.gc_pause_p95["p(95)"] // 0' "$summary" 2>/dev/null || echo 0)

# Pull thresholds from README or use defaults
latency_thresh=$(grep -o 'ack latency[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)
error_thresh=$(grep -o 'error rate[^<]*<[[:space:]]*\([0-9]\+\)%' load/README.md | grep -o '[0-9]\+' | head -n1)
cpu_thresh=$(grep -o 'CPU[^<]*<[[:space:]]*\([0-9]\+\)%' load/README.md | grep -o '[0-9]\+' | head -n1)
gc_thresh=$(grep -o 'GC pause p95[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)

latency_thresh=${latency_thresh:-120}
error_thresh=${error_thresh:-1}
cpu_thresh=${cpu_thresh:-80}
gc_thresh=${gc_thresh:-50}

fail=0
bc_check() { echo "$1" | bc -l; }
if (( $(bc_check "$latency_p95 > $latency_thresh") )); then echo "Latency p95 $latency_p95 exceeds $latency_thresh"; fail=1; fi
error_thresh_rate=$(bc <<< "$error_thresh/100")
if (( $(bc_check "$error_rate > $error_thresh_rate") )); then echo "Error rate $error_rate exceeds $error_thresh_rate"; fail=1; fi
if (( $(bc_check "$cpu > $cpu_thresh") )); then echo "CPU $cpu exceeds $cpu_thresh"; fail=1; fi
if (( $(bc_check "$gc_p95 > $gc_thresh") )); then echo "GC pause p95 $gc_p95 exceeds $gc_thresh"; fail=1; fi

if [ $fail -ne 0 ]; then
  exit 1
fi
