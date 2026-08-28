# PocketBase

Required variable: `POCKETBASE_URL`; optional `POCKETBASE_COLLECTION` defaults to `bench_records`. Create fields matching the logical record and index `runId`. PocketBase Records API creates one record per POST; it has no generic bulk-create endpoint, so batch-write is explicitly `not-supported` rather than a loop mislabeled as bulk. Cleanup must filter the run ID and delete returned records only.

Smoke: `npm run bench -- --provider pocketbase --count 1 --duration 1 --ramps 1`. Official docs: [Records API](https://pocketbase.io/docs/api-records/). Accessed 2026-08-28. SQLite-file direct mode is intentionally outside scope.
