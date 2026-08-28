# Read/Write Throughput Benchmark Design

**Date:** 2026-08-28  
**Status:** Approved

## Purpose

Measure the performance a real free-tier user can expect from Appwrite, Convex, Neon, and Supabase, plus the performance of self-hosted PocketBase and TrailBase on the test VPS. The first suite isolates:

1. indexed point reads;
2. individual inserts; and
3. batched inserts.

Every result must be reproducible, identify the exact transport tested, and stay within documented provider terms and configured resource budgets.

## Architecture

One Node.js/TypeScript CLI owns workload generation, timing, ramp stages, safety budgets, result serialization, and cleanup. Six thin provider adapters implement only supported operations:

- API point read;
- API single insert;
- API batch insert;
- direct point read;
- direct single insert; and
- direct batch insert.

Unsupported paths are reported as `not-supported`; they are never emulated. API and direct results remain separate because their authentication, pooling, network, SDK, and protocol costs differ.

## Provider coverage

| Provider | API | Direct from local runner |
| --- | --- | --- |
| Appwrite | Data API | Not exposed by managed service |
| Convex | Deployed query/mutations | Not exposed |
| Neon | Data API | PostgreSQL pooler/direct URL when supplied |
| PocketBase | Records API | Not exposed remotely; SQLite file access is not comparable |
| Supabase | Data API | PostgreSQL pooler and direct URL |
| TrailBase | Records API | Not exposed remotely; SQLite file access is not comparable |

Direct-on-VPS SQLite benchmarks are outside v1 because they measure a different client location and access path.

## Logical record and workloads

Each provider stores the same logical record:

- generated primary ID;
- benchmark run ID;
- monotonic sequence;
- creation timestamp; and
- deterministic fixed-size payload.

Defaults are a 1 KiB payload and batches of 100 records. Read tests choose uniformly from pre-seeded known IDs and fetch one record by its indexed primary ID. Individual-write tests insert one new record per request. Batch-write tests insert 100 records per request and report both records/second and requests/second.

A run follows:

1. validate configuration and safety budget;
2. create benchmark-owned schema/collection/functions if needed;
3. seed point-read records;
4. run a smoke check for each selected operation;
5. warm up without recording headline metrics;
6. run bounded measured stages;
7. cool down between stages; and
8. remove only data owned by the unique run ID.

Cleanup failures are reported prominently and include a safe retry command.

## Load model and stability

Stages use explicit duration, target concurrency, and optional requests-per-second ceilings. The runner starts conservatively and never performs an unbounded search for a breaking point. A stage is stable only when it completes its duration without crossing configured error, timeout, or throttling thresholds. The reported maximum is the highest stable measured stage.

The runner stops escalation when a stage is unstable, a write/storage/request budget would be exceeded, or the provider returns sustained throttling/resource-exhaustion responses. A cooldown separates stages. No runner behavior bypasses authentication, evades rate limits, distributes traffic across accounts, or retries aggressively after throttling.

## Free-tier safety

Committed provider profiles define conservative defaults for:

- stage duration and concurrency sequence;
- requests per second;
- records written per stage and per run;
- total run duration;
- error, timeout, and throttle stop thresholds; and
- cooldown duration.

Official provider limits are cited where explicit. Undocumented ceilings are labeled assumptions and remain low. Exceeding any committed free-tier ceiling requires both explicit numeric CLI overrides and `--confirm-stress`. PocketBase and TrailBase retain finite defaults to protect the VPS.

Credentials are read from environment variables or ignored local files. Secret-bearing files are never copied into examples, results, logs, fixtures, or committed configuration. Result metadata includes endpoint host and mode, never credentials or connection strings.

## Metrics and result format

Each stage records:

- provider and transport/mode;
- workload, payload size, and batch size;
- target concurrency and request-rate ceiling;
- stage and warmup durations;
- attempted/successful/failed requests;
- successful records;
- records/second and requests/second;
- p50, p95, and p99 request latency;
- timeouts;
- errors grouped by sanitized status/code;
- throttled requests;
- stability decision and stop reason;
- timestamp, run ID, runner version, and Node version.

Raw JSON is canonical. A generated Markdown summary is for review and publication. Headline comparisons must show API and direct modes separately and disclose account tier, provider region, runner location, VPS specifications, dataset size, and test date.

## Fairness and interpretation

The suite fixes logical record shape, payload size, operation semantics, stage policy, and runner location. It does not claim that unlike products have identical internal guarantees. Results must note consistency behavior, transaction semantics, caching, serverless cold starts, indexes, connection pooling, and provider-specific batch semantics.

“Maximum reads/writes per second” means the highest stable observed throughput under this declared methodology. It is not a universal service limit or SLA.

## Verification and documentation

Automated tests cover metric calculations, percentile behavior, safety-budget rejection, stage stop behavior, and one fake-adapter end-to-end flow. Provider smoke tests perform one setup, read, individual write, batch write, and cleanup. Real provider load tests never run in the normal unit-test or CI command.

The public documentation will include:

- quick start and CLI examples;
- complete methodology and result interpretation;
- provider-by-provider setup and required variables;
- sourced free-tier limits and explicit assumptions;
- safety override procedure;
- smoke-test procedure;
- full benchmark procedure;
- cleanup and recovery procedure; and
- reproducible result publication instructions.
