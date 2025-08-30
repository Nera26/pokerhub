# Wallet Reconciliation

The wallet service runs a daily reconciliation that compares the sum of journal
entries with the persisted account balances. Any mismatch is logged so that
operators can investigate.

## Dashboard
- Metabase: [Wallet Reconciliation](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## Reviewing logs

Reconciliation executes at midnight UTC. Discrepancies are reported with a log
entry similar to:

```
wallet reconciliation discrepancies [{"account":"user","balance":100,"journal":90}]
```

Check the backend service logs for this message:

```bash
kubectl logs <backend-pod> | grep "wallet reconciliation"
```

An empty array means all accounts match their journal totals. Any rows listed
indicate the account name, its stored balance and the computed journal sum.

## Manual run

If you need to execute the check on demand, open a Node shell inside the
backend workspace and invoke the service method:

```bash
npx ts-node -e "require('./src/main').app.get('WalletService').reconcile()" --workspace backend
```

The method returns the same report that the scheduled job logs.

