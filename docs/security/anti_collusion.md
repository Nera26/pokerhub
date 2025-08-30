# Anti-Collusion Heuristics

Core analytics functions live in [`analytics/anti_collusion/`](../../analytics/anti_collusion) and surface suspicious coordination between players.

## Implemented Checks
- **Shared IPs** – flags groups of accounts connecting from the same network.
- **Chip Dumping** – aggregates transfers to detect unusually large one-way flows.
- **Synchronized Betting** – identifies players acting within tight time windows on a hand.

The heuristics return candidate cases for manual review and feed the compliance alerting pipeline.
