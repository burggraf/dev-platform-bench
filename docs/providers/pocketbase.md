# PocketBase

Set `POCKETBASE_URL`, `POCKETBASE_BEARER_TOKEN`, and optionally `POCKETBASE_COLLECTION`. Obtain the token through the supplied test account's normal PocketBase auth login (`POST /api/collections/users/auth-with-password`); place only the returned token in the ignored environment, never in shell history, reports, or Git. Setup rejects missing auth.

Record IDs are 15-character PocketBase physical IDs derived deterministically from the logical UUID; the full logical ID is retained in indexed `benchId`. Configure fields `benchId`, `runId`, `sequence`, `createdAt`, and `payload`, with indexes on `benchId` and `runId`. The Records API has no generic bulk-create endpoint, so batch-write is `not-supported`. Cleanup repeatedly fetches page 1 with a safely encoded run filter and deletes only returned IDs.

Smoke: `npm run bench -- --provider pocketbase --smoke-only`. Official: [auth](https://pocketbase.io/docs/api-authentication/), [Records API](https://pocketbase.io/docs/api-records/), accessed 2026-08-28.
