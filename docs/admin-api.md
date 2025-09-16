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

## Admin Tab Management

Runtime configuration of admin dashboard tabs is available through the `/admin/tabs` endpoints:

- `GET /admin/tabs` – list combined config and database tabs (each entry includes a `source` field indicating `config` or `database`).
- `POST /admin/tabs` – create a persistent tab (`id`, `title`, `icon`, `component`).
- `PUT /admin/tabs/{id}` – update an existing persistent tab.
- `DELETE /admin/tabs/{id}` – remove a persistent tab.

Tabs created via the API are stored in the `admin_tab` table and exposed to the frontend immediately.
