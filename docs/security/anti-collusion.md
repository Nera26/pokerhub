# Anti-Collusion Monitoring

PokerHub uses behavioral analysis and auditing to detect players collaborating unfairly.

## Heuristics
- **Shared IP or Device Fingerprints**: Flag players repeatedly joining tables from the same network or hardware.
- **Synchronized Betting Patterns**: Detect coordinated timing or identical wager sequences.
- **Chip Dumping**: Monitor rapid transfers of chips between the same accounts.
- **Unusual Win Rates**: Identify players with statistically improbable results against specific opponents.
- **Table Selection**: Track groups entering and leaving tables together.

## Analytics Pipeline
Raw game and session events stream into an analytics warehouse where scheduled queries surface
potential collusion for review.

### Example Queries
```sql
-- Players sharing an IP
SELECT ip, array_agg(player_id) AS players
FROM session_logs
GROUP BY ip
HAVING COUNT(DISTINCT player_id) > 1;

-- Chip dumping detection
SELECT from_player, to_player, SUM(amount) AS total_transferred
FROM chip_transfers
GROUP BY from_player, to_player
HAVING total_transferred > 100000;

-- Synchronized betting patterns
SELECT hand_id, array_agg(player_id) AS actors
FROM betting_events
GROUP BY hand_id
HAVING stddev(action_time_ms) < 200;
```

### Review Cadence
- **Hourly**: Queries populate `collusion_alerts` table.
- **Daily**: Compliance reviews new alerts and tags false positives.
- **Weekly**: Security team audits alert quality and query thresholds.

## Audit Procedures
1. **Daily Review**: Compliance team reviews heuristic alerts and cross‑checks game logs.
2. **Hand History Analysis**: Use automated tools to replay flagged hands and confirm collusion.
3. **Account Linking**: Investigate IP logs, device IDs, and payment methods for shared attributes.
4. **Player Interviews**: Reach out to involved accounts for explanations when evidence is inconclusive.
5. **Enforcement**: Suspend accounts, confiscate funds, and notify regulators if collusion is confirmed.
6. **Record Keeping**: Retain investigation records for **5 years** in secure storage.

