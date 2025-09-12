# Audit Score

**Version:** 1.0.0
**Last Updated:** 2025-09-12

The `audit:score` script runs static analysis and reports a scorecard. It no longer writes `audit/score.json`; the JSON is printed to standard output.

## Usage

Run:

```bash
npm run audit:score
```

Provide a historical baseline via the `AUDIT_BASELINE` environment variable when needed:

```bash
AUDIT_BASELINE='{"UNUSED":10,"DUPLICATES":0,"STATIC":5}' npm run audit:score
```

Capture the output and store it in an external data store or CI artifact to preserve history.
