# Admin API

## POST /admin/tournaments/simulate

Simulates tournament structures using a Monte Carlo model.

### Request

```json
{
  "levels": 100,
  "levelMinutes": 5,
  "increment": 0.05,
  "entrants": 10000,
  "runs": 100
}
```

### Response

```json
{
  "averageDuration": 250,
  "durationVariance": 400
}
```
