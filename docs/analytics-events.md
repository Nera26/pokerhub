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
