# Game Engine Specification

**Version:** 1.2.0
**Last Updated:** 2025-08-30

For upcoming milestones, see the [milestone plan](./milestone-plan.md).

Implementation lives under [`backend/src/game`](../backend/src/game) where the
state machine and engine workers are defined. Tournament operations are
documented in the [Tournament Handbook](./tournament-handbook.md), and ledger
procedures are covered in the [Reconciliation Guide](./reconciliation-guide.md).

## State Machine
```mermaid
stateDiagram-v2
    [*] --> PreFlop
    PreFlop --> Flop: bets settled
    Flop --> Turn: bets settled
    Turn --> River: bets settled
    River --> Showdown: bets settled
Showdown --> [*]: hand settled
```

![Betting round state diagram](./images/betting-rounds.svg)

## Message Schemas

### `PlayerAction`
```json
{
  "actionId": "uuid",
  "type": "postBlind | bet | raise | call | check | fold | next",
  "tableId": "uuid",
  "playerId": "uuid",
  "amount": 100 // required for postBlind, bet, raise; optional for call
}
```

### `GameState`
```json
{
  "type": "table/state",
  "tableId": "uuid",
  "street": "preflop | flop | turn | river | showdown",
  "pot": 0,
  "currentBet": 0,
  "players": [
    { "id": "uuid", "stack": 100, "bet": 0, "folded": false, "allIn": false }
  ],
  "sidePots": [ { "amount": 0, "players": ["uuid"] } ]
}
```

## State Verification

To validate that a hand progressed deterministically, any action in the log can be
replayed on demand.

Fetch the server-side reconstruction at a specific index:

```http
GET /api/hands/{handId}/state/{actionIndex}
```

The response is a `GameState` payload.  Clients can fetch the full log via
`GET /api/hands/{handId}/log` and independently replay actions to verify
the returned state matches their own simulation.

### Example

```bash
curl /api/hands/hand1/state/3 | jq
# {
#   "street": "flop",
#   "pot": 120,
#   "currentBet": 20,
#   "players": [ ... ]
# }
```

## Timers

- **Action**: 30s per decision
- **Heartbeat**: 5s keepalive
- **Reconnect Grace**: 90s before seat is forfeited

## Edge Cases

| Scenario | Resolution |
|---------|-----------|
| Simultaneous timeouts | Seat order determines who acts first. |
| All but one player disconnects | Remaining player wins the pot. |
| Player all-in with fewer chips | Side pots track excess bets. |
| Tie at showdown | Pot split equally among winners. |
| Out-of-turn action | Server rejects and prompts correct player. |

## Retry Semantics

- Each `PlayerAction` carries a unique `actionId` generated client-side.
- The server de-duplicates actions by `actionId`; resubmitting the same id is safe.
- Clients retry failed submissions up to three times with exponential backoff.
- State fetch endpoints are idempotent and may be retried without side effects.

## Message Flow Example

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: PlayerAction(actionId)
  S-->>C: Ack
  S->>C: GameState update
```

## Mitigation Strategies

- Duplicate action protection via Redis idempotency keys.
- Rate limiting blocks clients after 30 actions in 10 seconds.
- Commit-reveal RNG proves deck fairness.
- Collusion tracking records user, device and IP on every action.

## Changelog
- **1.2.0** – 2025-08-30 – Cross-referenced tournament and reconciliation guides.
- **1.1.0** – 2025-08-30 – Added version metadata and message flow diagram.
- **1.0.0** – 2025-01-04 – Initial publication with hand log/state endpoints and SLO definitions.
