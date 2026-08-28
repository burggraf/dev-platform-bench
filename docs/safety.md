# Safety and recovery

## Free-tier constraints

These are monthly/resource quotas, **not requests-per-second ceilings**. Sources were checked 2026-08-28 and must be checked again immediately before a live run.

| Provider | Relevant free-tier constraint | Official source |
| --- | --- | --- |
| Appwrite | 500,000 database reads and 250,000 database writes per month | [Database reads and writes](https://appwrite.io/docs/advanced/billing/database-reads-and-writes) |
| Convex | 0.5 GB database storage, 1 GB database I/O, and 1 million function calls per month | [Limits](https://docs.convex.dev/production/state/limits) |
| Neon | 0.5 GB storage, 100 compute-unit hours, and 5 GB public transfer per project/month | [Plans](https://neon.com/docs/introduction/plans) |
| Supabase | 500 MB database-size threshold; projects exceeding it can become read-only. Bandwidth quotas are documented separately. | [Database size](https://supabase.com/docs/guides/platform/database-size), [Bandwidth](https://supabase.com/docs/guides/storage/serving/bandwidth) |
| PocketBase | Self-hosted; VPS and SQLite limits apply | [PocketBase documentation](https://pocketbase.io/docs/) |
| TrailBase | Self-hosted; VPS and SQLite limits apply | [TrailBase documentation](https://trailbase.io/documentation/) |

The managed-API profiles use 5 RPS, one-second stages, and concurrency 1–2. Self-hosted API profiles use 10 RPS. Direct PostgreSQL starts at 20 RPS because it avoids managed HTTP APIs, but remains bounded. These are conservative starting assumptions—not capacity claims or provider limits.

## Pre-run checklist

1. Review the provider's current Terms of Service, quota dashboard, and the sources above.
2. Use a benchmark-only table/collection and test account.
3. Set one provider's environment variables; never paste secrets into commands or results.
4. Run `npm test`, then `npm run bench -- --provider MODE --dry-run`.
5. Run only `npm run bench -- --provider MODE --smoke-only` until setup, read, write, batch capability, and cleanup are verified.
6. Inspect the JSON cleanup status and verify zero records for the run ID.

## Runtime controls

Preflight conservatively counts setup, provider-specific seed requests, smoke operations, warmup, every measured stage, batch records, cooldowns, and timeout allowance. The same `maxRequests` and `maxRecords` are enforced globally at runtime before dispatch. Normal live profiles reject zero RPS and ramps above concurrency 20. Raising a numeric ceiling requires the explicit override plus `--confirm-stress`.

Timeouts abort cooperative HTTP/database work and race non-cooperative lifecycle calls so cleanup can still run. Throttling is not retried aggressively. Cleanup accepts only generated UUID run IDs and emits a bounded status plus a retry command.

## Recovery

If cleanup fails or times out, stop testing. Run only the emitted `--cleanup-run <uuid>` command, verify zero matching records, and never broaden its predicate. Keep results local until their endpoint and error fields have been inspected for redaction.
