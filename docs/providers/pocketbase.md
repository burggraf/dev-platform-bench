# PocketBase

Required `POCKETBASE_URL`; optional `POCKETBASE_COLLECTION` defaults to `bench_records`. PocketBase record IDs must be 15 characters, so the adapter stores the logical deterministic ID in indexed `benchId` and sends a 15-character physical ID. Create fields `benchId`, `runId`, `sequence`, `createdAt`, `payload`, index `benchId` and `runId`. Records API has no generic bulk-create endpoint; batch-write is explicit `not-supported`.

Cleanup repeatedly fetches page 1 with the run filter and deletes returned IDs, preventing page-shift skips. Smoke: `npm run bench -- --provider pocketbase --count 1 --duration 1 --ramps 1`. Official: [Records API](https://pocketbase.io/docs/api-records/), accessed 2026-08-28. SQLite-file direct mode is out of scope.
