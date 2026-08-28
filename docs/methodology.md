# Methodology

## Workload and lifecycle

Every run creates a unique run ID and deterministic UUIDv4-compatible IDs in 1 KiB logical records: `id`, `runId`, `sequence`, `createdAt`, and `payload`. The default seed is 100 records; measured batch requests contain 100 records. Setup, seed, smoke (point read, single insert, batch insert), optional read warmup, measured ramps, cooldown only between ramps, and run-scoped cleanup are performed in that order. Cleanup uses a fresh bounded signal even when setup or measurement fails; JSON records `ok`, `failed`, or `timeout` plus a retry command.

Writes receive a fresh UUID per measured request. Reads choose seeded IDs. API and direct/pooler transports are separate results. SQLite file access is not included.

## Stages and metrics

`--ramps 1,2` runs bounded concurrency stages; each stage runs for `--duration` seconds, with optional `--requests-per-second` pacing, `--timeout-ms`, and cooldown. A request timeout, provider throttle, or configured error threshold stops escalation; throttles are not aggressively retried. Percentiles use nearest-rank over successful request latency. Rates use actual elapsed wall-clock time. Batch results report both request/s and logical record/s.

## Interpretation

A maximum is the highest stable configured stage, not a provider limit or SLA. Record provider region/tier, runner location, Node version, schema/indexes, dataset, payload, batch semantics, stage settings, and date. Note consistency, caching, cold starts, pooling, transaction behavior, and server specifications.

Official starting references and access date (2026-08-28): [Appwrite databases](https://appwrite.io/docs/products/databases), [Convex limits](https://docs.convex.dev/production/state/limits), [Neon Data API](https://neon.tech/docs/data-api/get-started), [PocketBase Records API](https://pocketbase.io/docs/api-records/), [Supabase insert](https://supabase.com/docs/reference/javascript/insert), and [TrailBase API](https://trailbase.io/documentation/api/). Explicit provider ceilings must be checked against current documentation before a live run; repository profiles are conservative assumptions, not claimed free-tier limits.
