#!/usr/bin/env bash
set -euo pipefail
summary="$1"
gc_hist="${2:-$(dirname "$summary")/gc-histogram.json}"
heap_hist="${3:-$(dirname "$summary")/heap-histogram.json}"
cpu_hist="${4:-$(dirname "$summary")/cpu-histogram.json}"

# Extract metrics from summary
latency_p50=$(jq -r '.metrics.ack_latency["p(50)"] // .metrics.ws_latency["p(50)"] // 0' "$summary" 2>/dev/null || echo 0)
latency_p95=$(jq -r '.metrics.ack_latency["p(95)"] // .metrics.ws_latency["p(95)"] // 0' "$summary")
latency_p99=$(jq -r '.metrics.ack_latency["p(99)"] // .metrics.ws_latency["p(99)"] // 0' "$summary" 2>/dev/null || echo 0)
throughput=$(jq -r '.metrics.actions.rate // .metrics.throughput.rate // 0' "$summary" 2>/dev/null || echo 0)
error_rate=$(jq -r '.metrics.error_rate.rate // 0' "$summary" 2>/dev/null || echo 0)
cpu_p95=$(node -e "try{const h=require('$cpu_hist');const k=Object.keys(h).map(Number).sort((a,b)=>a-b);const tot=k.reduce((s,i)=>s+h[i],0);let c=0,p=0;for(const i of k){c+=h[i];if(!p && c/tot>=0.95){p=i;}}console.log(p);}catch(e){console.log(0)}")
gc_p95=$(node -e "try{const h=require('$gc_hist');const k=Object.keys(h).map(Number).sort((a,b)=>a-b);const tot=k.reduce((s,i)=>s+h[i],0);let c=0,p=0;for(const i of k){c+=h[i];if(!p && c/tot>=0.95){p=i;}}console.log(p);}catch(e){console.log(0)}")
heap_p95=$(node -e "try{const h=require('$heap_hist');const k=Object.keys(h).map(Number).sort((a,b)=>a-b);const tot=k.reduce((s,i)=>s+h[i],0);let c=0,p=0;for(const i of k){c+=h[i];if(!p && c/tot>=0.95){p=i;}}console.log(p);}catch(e){console.log(0)}")

# Pull thresholds from README or use defaults
latency_p95_thresh=$(grep -o 'ack latency p95[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)
latency_p99_thresh=$(grep -o 'ack latency p99[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)
error_thresh=$(grep -o 'error rate[^<]*<[[:space:]]*\([0-9]\+\)%' load/README.md | grep -o '[0-9]\+' | head -n1)
cpu_thresh=$(grep -o 'CPU[^<]*<[[:space:]]*\([0-9]\+\)%' load/README.md | grep -o '[0-9]\+' | head -n1)
gc_thresh=$(grep -o 'GC pause p95[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)
heap_thresh=$(grep -o 'heap usage p95[^<]*<[[:space:]]*\([0-9]\+\)MB' load/README.md | grep -o '[0-9]\+' | head -n1)
latency_p50_thresh=$(grep -o 'ack latency p50[^<]*<[[:space:]]*\([0-9]\+\)ms' load/README.md | grep -o '[0-9]\+' | head -n1)
throughput_thresh=$(grep -o 'throughput[^>]*>[[:space:]]*\([0-9]\+\)' load/README.md | grep -o '[0-9]\+' | head -n1)

latency_p50_thresh=${latency_p50_thresh:-40}
latency_p95_thresh=${latency_p95_thresh:-120}
latency_p99_thresh=${latency_p99_thresh:-200}
throughput_thresh=${throughput_thresh:-0}
error_thresh=${error_thresh:-1}
cpu_thresh=${cpu_thresh:-80}
gc_thresh=${gc_thresh:-50}
heap_thresh=${heap_thresh:-1024}

fail=0
bc_check() { echo "$1" | bc -l; }
if (( $(bc_check "$latency_p50 > $latency_p50_thresh") )); then echo "Latency p50 $latency_p50 exceeds $latency_p50_thresh"; fail=1; fi
if (( $(bc_check "$latency_p95 > $latency_p95_thresh") )); then echo "Latency p95 $latency_p95 exceeds $latency_p95_thresh"; fail=1; fi
if (( $(bc_check "$latency_p99 > $latency_p99_thresh") )); then echo "Latency p99 $latency_p99 exceeds $latency_p99_thresh"; fail=1; fi
error_thresh_rate=$(bc <<< "$error_thresh/100")
if (( $(bc_check "$error_rate > $error_thresh_rate") )); then echo "Error rate $error_rate exceeds $error_thresh_rate"; fail=1; fi
if (( $(bc_check "$throughput < $throughput_thresh") )); then echo "Throughput $throughput below $throughput_thresh"; fail=1; fi
if (( $(bc_check "$cpu_p95 > $cpu_thresh") )); then echo "CPU p95 $cpu_p95 exceeds $cpu_thresh"; fail=1; fi
if (( $(bc_check "$gc_p95 > $gc_thresh") )); then echo "GC pause p95 $gc_p95 exceeds $gc_thresh"; fail=1; fi
if (( $(bc_check "$heap_p95 > $heap_thresh") )); then echo "Heap usage p95 $heap_p95 exceeds $heap_thresh"; fail=1; fi

if [ $fail -ne 0 ]; then
  exit 1
fi
