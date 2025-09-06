# KYC Configuration

PokerHub allows certain jurisdictions to be blocked during identity checks.

Set `KYC_BLOCKED_COUNTRIES` (comma separated ISO country codes) to control the list.

```bash
export KYC_BLOCKED_COUNTRIES="US,CA"
```

This maps to `kyc.blockedCountries` in the backend `ConfigService` and prevents users from those countries from passing KYC.

Known politically exposed persons are stored in a local `pep_list` table.
Run database migrations to seed this table and keep it up to date with
additional entries as required.
