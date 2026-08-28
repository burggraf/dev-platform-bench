# Safety and recovery

## Pre-run checklist

- Use a unique benchmark-owned table/collection and confirm its schema/index on the selected provider.
- Review current plan, quotas, terms, region, and runner/VPS limits.
- Set only the variables for one provider. Never paste credentials into commands, results, issues, or chat.
- Start with the fake adapter and `--dry-run`; smoke one provider at a time.
- Keep defaults: 100 seed records, 100-record batches, 1-second stages, low concurrency, finite profile budgets.
- Do not use `--confirm-stress` unless the numeric override is intentional and approved.

## Controls

Profiles cap duration, ramps, request rate, records, run time, and cooldown. `preflight` rejects requests beyond those assumptions unless `--confirm-stress` is supplied. Per-request timeouts prevent a hung network operation from holding a stage indefinitely. Error, timeout, and throttle counters stop escalation; throttling is never retried aggressively.

## Commands

```sh
npm ci
npm test
npm run bench -- --provider fake --dry-run
npm run bench -- --provider fake --count 100
npm run bench -- --provider supabase-api --count 100 --duration 1 --ramps 1
```

The final command is a one-stage smoke/measurement invocation and requires configured credentials. For live validation, prefer a dedicated smoke-only configuration and stop after cleanup. If cleanup fails, rerun the provider's documented run-ID delete/filter command, verify zero records with that run ID, and do not broaden the delete predicate. Preserve only sanitized report metadata.

## Post-run checklist

Verify benchmark-owned run data is absent, no non-benchmark records changed, results contain endpoint hosts only, and no credentials occur in tracked or published files. Never run live load from unit tests or CI.
