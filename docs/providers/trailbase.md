# TrailBase

Set `TRAILBASE_URL` and `TRAILBASE_API_NAME`. Requests use `/api/records/v1/{api_name}`. The logical deterministic ID is UUIDv4-compatible and is stored as TrailBase's primary `id`; point reads use `/api/records/v1/{api_name}/{id}`. Configure `runId`, `sequence`, `createdAt`, and `payload` fields and index `runId`. Batch is explicit `not-supported` until a deployment's true transaction endpoint is configured.

Cleanup repeatedly fetches offset 0 using exact `filter[runId][$eq]` URL encoding, then deletes only IDs returned by that filter. A cleanup result and retry command are emitted in JSON. Official: [Records API](https://trailbase.io/documentation/api/), accessed 2026-08-28. SQLite direct mode is out of scope.
