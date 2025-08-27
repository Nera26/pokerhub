# Load Testing and Chaos Experiments

This folder contains k6 load tests and Kubernetes manifests for room worker deployments.

## k6 Test
- `k6-room-workers.js` exercises the `/rooms` endpoint.
- Thresholds ensure `p95` latency < `120ms` and memory leak < `1%` via the `X-Mem-Leak` response header.
- `k6-10k-tables.js` simulates 10k concurrent table fetches.
- `k6-soak.js` runs a 24h soak with GC pause tracking via the `X-GC-Pause` header.

Run locally:
```bash
k6 run infra/tests/load/k6-room-workers.js --summary-export=summary.json
k6 run infra/tests/load/k6-10k-tables.js
k6 run infra/tests/load/k6-soak.js
```

## Kubernetes Manifests
- `k8s-room-workers.yaml` deploys multiple room workers.
- `chaos/pod-kill.yaml` randomly kills a worker pod every 5 minutes.
- `chaos/network-latency.yaml` injects 100ms network delay for 1 minute each hour.

Apply manifests:
```bash
kubectl apply -f infra/tests/load/k8s-room-workers.yaml
kubectl apply -f infra/tests/load/chaos/pod-kill.yaml
kubectl apply -f infra/tests/load/chaos/network-latency.yaml
```

## Artillery
- `artillery-10k-tables.yml` mirrors the 10k-table k6 scenario.
- `artillery-soak.yml` performs a 24h soak while capturing GC pauses.

Run locally:
```bash
artillery run infra/tests/load/artillery-10k-tables.yml
artillery run infra/tests/load/artillery-soak.yml
```
