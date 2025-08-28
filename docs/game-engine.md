# Game Engine Load & Soak Testing

## High‑scale simulation
- Script: `load/k6-ws-soak.js`
- Default scale: 80k sockets spread over 10k tables
- Network faults: 5% packet loss and up to 200 ms jitter
- Deterministic replay: provide identical `RNG_SEED` to reproduce event sequences

## Running the 24 h soak test
```sh
k6 run load/k6-ws-soak.js \
  -e WS_URL=ws://localhost:3000 \
  -e METRICS_URL=http://localhost:3000/metrics \
  -e RNG_SEED=1
```
The script pulls `{ heapUsed, gcPauseP95 }` from `METRICS_URL` at start and end.
It fails when:
- memory growth exceeds **1 %**
- GC pause p95 exceeds **50 ms**

## Latest results
_No 24 h soak run has been recorded yet._
Run the command above and append the metrics here when available.
