# Engine Specification

**Version:** 1.0.0
**Last Updated:** 2025-09-05

This document outlines the responsibilities and message flow of the PokerHub game engine.

## Overview

The engine advances a hand through betting streets, validates player actions, and
broadcasts state updates to all seated clients.  Implementation lives in
[`backend/src/game`](../backend/src/game).

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

## Messages

| Type | Description |
|------|-------------|
| `PlayerAction` | Client request containing an action id, type and optional amount. |
| `GameState` | Server broadcast showing pots, bets, seats and street. |

Both messages are JSON and validated with Zod schemas.

## Timers

- **Action:** 30 seconds per decision
- **Heartbeat:** 5 second keepalive
- **Reconnect Grace:** 90 seconds before seat is forfeited

## Retry & Idempotency

Actions carry a client‑generated `actionId`.  The server de‑duplicates on this
field so resubmitting is safe.  State endpoints are idempotent and may be
retried without side effects.

## Edge Cases

| Scenario | Resolution |
|---------|-----------|
| Simultaneous timeouts | Seat order determines who acts first. |
| All but one player disconnects | Remaining player wins the pot. |
| Player all‑in with fewer chips | Side pots track excess bets. |
| Tie at showdown | Pot split equally among winners. |
| Out‑of‑turn action | Server rejects and prompts correct player. |

## Verification

Any hand can be replayed from the action log.  Fetch the state at a specific
index via `GET /api/hands/{handId}/state/{actionIndex}` and compare to a client
simulation to prove determinism.

