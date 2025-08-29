# Infrastructure

## Global Load Balancer

PokerHub is fronted by a global external load balancer with an Anycast IP. Clients connect to the nearest edge, and the provider routes traffic to the closest healthy region.

### Routing
- The Kubernetes ingress (`infra/global-lb/ingress.yaml`) provisions a cloud load balancer and binds it to a global static IP.
- WebSocket connections use NGINX annotations to hash on `tableId` and `userId`, keeping players for the same table on the same backend.

### Failover
- If a region becomes unavailable, the Anycast IP automatically shifts connections to remaining regions without DNS changes.
- On reconnect, clients retain table or user affinity via the hashing policy, ensuring minimal disruption during failover.

## Postgres PITR and Backups

PokerHub's primary Postgres cluster is configured for point‑in‑time recovery (PITR) and cross‑region durability.

- `archive_mode` ships WAL segments every five minutes to an S3 bucket with versioning enabled.
- S3 replication copies WAL archives and hourly automated snapshots to `${SECONDARY_REGION}`.
- A read replica in the secondary region provides warm stand‑by capacity and a rapid promotion path.
- Nightly restore drills are executed via the Helm CronJob under `infra/pitr/helm`, running
  `infra/disaster-recovery/tests/restore-backup.sh` against the latest snapshot.
- Metrics from the drill ensure **RTO ≤ 30 minutes** and **RPO ≤ 5 minutes**.
