# Infrastructure

## Global Load Balancer

PokerHub is fronted by a global external load balancer with an Anycast IP. Clients connect to the nearest edge, and the provider routes traffic to the closest healthy region.

### Routing
- The Kubernetes ingress (`infra/global-lb/ingress.yaml`) provisions a cloud load balancer and binds it to a global static IP.
- WebSocket connections use NGINX annotations to hash on `tableId` and `userId`, keeping players for the same table on the same backend.

### Failover
- If a region becomes unavailable, the Anycast IP automatically shifts connections to remaining regions without DNS changes.
- On reconnect, clients retain table or user affinity via the hashing policy, ensuring minimal disruption during failover.
