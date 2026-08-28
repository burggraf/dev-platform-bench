# TrailBase

Set `TRAILBASE_URL`, `TRAILBASE_BEARER_TOKEN`, and `TRAILBASE_API_NAME`. Obtain a bearer token through the deployment's documented test-account login; keep it only in ignored environment configuration. Setup rejects missing auth. Requests use `/api/records/v1/{api_name}`. The deterministic logical ID is a valid UUIDv4 and is stored as the primary `id`; point reads use `/api/records/v1/{api_name}/{id}`. Configure `runId`, `sequence`, `createdAt`, and `payload`, with a runId index. Batch remains explicitly `not-supported` until a verified transaction endpoint is available.

Cleanup repeatedly fetches offset 0 using exact encoded `filter[runId][$eq]`, then deletes only returned IDs. Smoke: `npm run bench -- --provider trailbase --smoke-only`. Official: [documentation](https://trailbase.io/documentation/), [API](https://trailbase.io/documentation/api/), accessed 2026-08-28.
