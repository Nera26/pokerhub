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
- **Latency Correlation**: Compare action timestamps; corr ≥0.95 over ≥20 shared hands indicates synchronized play.
- **Chat Signaling**: Scan table chat for shared keywords or timing used to coordinate plays.
- **Unbalanced Pot Contributions**: Flag repeated small bets where players fold to each other to shift chips.
- **Device or Geolocation Swaps**: Detect accounts that change devices or regions in tandem.
- **Correlated Betting Across Hands**: Compare bet sequences over multiple hands to uncover coordinated strategies.
- **Network Proximity**: Flag accounts playing from unusually close geographic locations.

## Statistical Detection Thresholds

- IP overlap: flag cohorts when >3 accounts share an IP within 24 hours.
- Win rate anomaly: z-score ≥ 3 over 100 hands against same opponents.
- Chip transfers: single-direction transfers exceeding 100k chips per day.
- Action timing: stddev of bet timing <200 ms across a hand.
- Correlated betting: Pearson correlation ≥0.9 over ≥3 shared hands.
- Network proximity: distance <50 km between accounts.
- Latency correlation: corr(action_time_ms) ≥0.95 over ≥20 shared hands.

## Replay Tools

- Deterministic hand replays via [tests/performance/replay.ts](../../tests/performance/replay.ts).
- Histogram comparison with [scripts/compare-histograms.ts](../../scripts/compare-histograms.ts).

## Analytics Pipeline
Raw game and session events stream into an analytics warehouse where scheduled queries surface
potential collusion for review.

Scheduled SQL queries populate a `collusion_alerts` table used by reviewers. Supporting warehouse queries are
defined under [`../../infra/analytics/`](../../infra/analytics/).

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

-- Latency correlation
SELECT a.player_id AS player_a, b.player_id AS player_b,
       corr(a.action_time_ms, b.action_time_ms) AS latency_corr
FROM betting_events a
JOIN betting_events b ON a.hand_id = b.hand_id AND a.player_id < b.player_id
GROUP BY player_a, player_b
HAVING COUNT(*) >= 20 AND corr(a.action_time_ms, b.action_time_ms) > 0.95;
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
5. If collusion is confirmed, follow the regulator notification procedure.

### Regulator Notification Procedure
1. Compliance compiles evidence and determines impacted jurisdictions.
2. Notify regulators via the licensed portal or email within **24 hours** of confirmation.
3. Record confirmation numbers and attach them to the investigation ticket.
4. Archive the report and communications in secure storage for **5 years**.

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
5. **Enforcement**: Suspend accounts, confiscate funds, and notify regulators per the notification procedure above.
6. **Record Keeping**: Retain investigation records for **5 years** in secure storage.

## Periodic Review
- **Monthly**: Analytics and Security jointly evaluate alert precision and adjust query thresholds.
- **Quarterly**: External auditors sample flagged sessions to measure false‑negative rates and recommend new heuristics.
- Outcomes are logged in `collusion_reviews/<date>.md` and feed back into training data and detection logic.


## References
- [Collusion Review Runbook](../runbooks/collusion-review.md) – triage and escalation workflow.
