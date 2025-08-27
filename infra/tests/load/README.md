# Load Testing and Chaos Experiments

This folder contains k6 load tests and Kubernetes manifests for room worker deployments.

## k6 Test
- `k6-room-workers.js` exercises the `/rooms` endpoint.
- Thresholds ensure `p95` latency < `120ms` and memory leak < `1%` via the `X-Mem-Leak` response header.

Run locally:
```bash
k6 run infra/tests/load/k6-room-workers.js --summary-export=summary.json
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
