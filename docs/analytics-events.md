# Analytics Event Taxonomy v1

This document defines the analytics events emitted by the system. Each event
is validated against the corresponding JSON schema before being published to
Kafka.

## hand.start
Emitted when a new hand begins.

```json
{
  "type": "object",
  "required": ["handId", "players"],
  "additionalProperties": false,
  "properties": {
    "handId": { "type": "string", "format": "uuid" },
    "tableId": { "type": "string", "format": "uuid" },
    "players": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" }
    }
  }
}
```

## hand.end
Emitted when a hand is finished.

```json
{
  "type": "object",
  "required": ["handId"],
  "additionalProperties": false,
  "properties": {
    "handId": { "type": "string", "format": "uuid" },
    "tableId": { "type": "string", "format": "uuid" },
    "winners": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" }
    }
  }
}
```

## wallet.credit
Emitted when chips are credited to a wallet.

```json
{
  "type": "object",
  "required": ["accountId", "amount", "refType", "refId"],
  "additionalProperties": false,
  "properties": {
    "accountId": { "type": "string", "format": "uuid" },
    "amount": { "type": "number" },
    "refType": { "type": "string" },
    "refId": { "type": "string" }
  }
}
```

## wallet.debit
Emitted when chips are debited from a wallet. Shares the same schema as
`wallet.credit`.

## action.bet
Emitted when a player places a bet.

- `handId` – ID of the active hand
- `tableId` – Table where the action occurred
- `playerId` – Acting player
- `amount` – Chips wagered

```json
{
  "type": "object",
  "required": ["handId", "playerId", "amount"],
  "additionalProperties": false,
  "properties": {
    "handId": { "type": "string", "format": "uuid" },
    "tableId": { "type": "string", "format": "uuid" },
    "playerId": { "type": "string", "format": "uuid" },
    "amount": { "type": "number" }
  }
}
```

## action.call
Emitted when a player calls a bet.

- `handId` – ID of the active hand
- `tableId` – Table where the action occurred
- `playerId` – Acting player
- `amount` – Chips paid to call

```json
{
  "type": "object",
  "required": ["handId", "playerId", "amount"],
  "additionalProperties": false,
  "properties": {
    "handId": { "type": "string", "format": "uuid" },
    "tableId": { "type": "string", "format": "uuid" },
    "playerId": { "type": "string", "format": "uuid" },
    "amount": { "type": "number" }
  }
}
```

## action.fold
Emitted when a player folds.

- `handId` – ID of the active hand
- `tableId` – Table where the action occurred
- `playerId` – Acting player

```json
{
  "type": "object",
  "required": ["handId", "playerId"],
  "additionalProperties": false,
  "properties": {
    "handId": { "type": "string", "format": "uuid" },
    "tableId": { "type": "string", "format": "uuid" },
    "playerId": { "type": "string", "format": "uuid" }
  }
}
```

## tournament.register
Emitted when a player registers for a tournament.

- `tournamentId` – Target tournament
- `playerId` – Registering player

```json
{
  "type": "object",
  "required": ["tournamentId", "playerId"],
  "additionalProperties": false,
  "properties": {
    "tournamentId": { "type": "string", "format": "uuid" },
    "playerId": { "type": "string", "format": "uuid" }
  }
}
```

## tournament.eliminate
Emitted when a player is knocked out of a tournament.

- `tournamentId` – Tournament in which elimination occurred
- `playerId` – Player eliminated
- `position` – Finishing place
- `payout` – Chips awarded for the finish

```json
{
  "type": "object",
  "required": ["tournamentId", "playerId"],
  "additionalProperties": false,
  "properties": {
    "tournamentId": { "type": "string", "format": "uuid" },
    "playerId": { "type": "string", "format": "uuid" },
    "position": { "type": "number" },
    "payout": { "type": "number" }
  }
}
```

## wallet.reserve
Emitted when chips are reserved from a player's wallet.

- `accountId` – Player account
- `amount` – Chips reserved
- `refId` – Reference identifier (e.g. hand ID)

```json
{
  "type": "object",
  "required": ["accountId", "amount", "refId"],
  "additionalProperties": false,
  "properties": {
    "accountId": { "type": "string", "format": "uuid" },
    "amount": { "type": "number" },
    "refId": { "type": "string" }
  }
}
```

## wallet.commit
Emitted when reserved chips are committed to the pot.

- `refId` – Reference identifier (e.g. hand ID)
- `amount` – Total committed chips
- `rake` – Rake deducted

```json
{
  "type": "object",
  "required": ["refId", "amount", "rake"],
  "additionalProperties": false,
  "properties": {
    "refId": { "type": "string" },
    "amount": { "type": "number" },
    "rake": { "type": "number" }
  }
}
```
