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

## Sidebar Configuration

Additional admin sidebar items may be seeded through the `admin.sidebar` configuration key. These entries merge with rows from the `admin_tab` table so that any item defined in both sources appears only once.
