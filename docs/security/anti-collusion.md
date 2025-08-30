# Anti-Collusion Monitoring

PokerHub uses behavioral analysis and auditing to detect players collaborating unfairly.

Pipeline config: see [`../../infra/analytics/anti-collusion-analytics.yaml`](../../infra/analytics/anti-collusion-analytics.yaml).

## Heuristics
- **Shared IP or Device Fingerprints**: Flag players repeatedly joining tables from the same network or hardware.
- **Synchronized Betting Patterns**: Detect coordinated timing or identical wager sequences.
- **Chip Dumping**: Monitor rapid transfers of chips between the same accounts.
- **Unusual Win Rates**: Identify players with statistically improbable results against specific opponents.
- **Table Selection**: Track groups entering and leaving tables together.
- **Multi-Table Coordination**: Look for the same cohort appearing at several tables simultaneously.
- **Latency Correlation**: Compare action timestamps to spot microsecond-level coordination.
- **Chat Signaling**: Scan table chat for shared keywords or timing used to coordinate plays.
- **Unbalanced Pot Contributions**: Flag repeated small bets where players fold to each other to shift chips.
- **Device or Geolocation Swaps**: Detect accounts that change devices or regions in tandem.

## Statistical Detection Thresholds

- IP overlap: flag cohorts when >3 accounts share an IP within 24 hours.
- Win rate anomaly: z-score ≥ 3 over 100 hands against same opponents.
- Chip transfers: single-direction transfers exceeding 100k chips per day.
- Action timing: stddev of bet timing <200 ms across a hand.

## Replay Tools

- Deterministic hand replays via [tests/performance/replay.ts](../../tests/performance/replay.ts).
- Histogram comparison with [scripts/compare-histograms.ts](../../scripts/compare-histograms.ts).

## Analytics Pipeline
Raw game and session events stream into an analytics warehouse where scheduled queries surface
potential collusion for review.

The scheduled SQL lives in [`CollusionQueryService`](../../backend/src/analytics/collusion.queries.ts)
and populates a `collusion_alerts` table used by reviewers. Supporting warehouse queries are
defined under [`../../infrastructure/analytics/`](../../infrastructure/analytics/).

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

### Operational Review Procedures
1. Reviewers monitor Slack and Jira notifications for new alerts.
2. Open the alert in `/admin/collusion` to inspect session details.
3. Correlate evidence with game logs and document findings in the ticket.
4. Mark false positives or escalate per the [Collusion Review Runbook](../runbooks/collusion-review.md).

## Reviewer Workflow Example

See [Collusion Review Runbook procedure](../runbooks/collusion-review.md#review-procedure) for step-by-step reviewer actions.

## Alert Handling and Enforcement
- Alerts trigger Slack notifications and create Jira tickets for tracking.
- Confirmed cases result in immediate bankroll freeze pending investigation.
- Repeat offenders are blacklisted and their devices added to the fraud watchlist.

## Privacy and Data Retention
- Only metadata necessary for detection (IP, device ID, bet timing) is stored.
- Collusion logs are retained for **5 years** and encrypted at rest.
- Data access requires security approval and is logged for auditing.

## Audit Procedures
1. **Daily Review**: Compliance team reviews heuristic alerts and cross‑checks game logs.
2. **Hand History Analysis**: Use automated tools to replay flagged hands and confirm collusion.
3. **Account Linking**: Investigate IP logs, device IDs, and payment methods for shared attributes.
4. **Player Interviews**: Reach out to involved accounts for explanations when evidence is inconclusive.
5. **Enforcement**: Suspend accounts, confiscate funds, and notify regulators if collusion is confirmed.
6. **Record Keeping**: Retain investigation records for **5 years** in secure storage.

## Periodic Review
- **Monthly**: Analytics and Security jointly evaluate alert precision and adjust query thresholds.
- **Quarterly**: External auditors sample flagged sessions to measure false‑negative rates and recommend new heuristics.
- Outcomes are logged in `collusion_reviews/<date>.md` and feed back into training data and detection logic.


## References
- [Collusion Review Runbook](../runbooks/collusion-review.md) – triage and escalation workflow.
