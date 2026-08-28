# PocketBase

Set `POCKETBASE_URL`, `POCKETBASE_BEARER_TOKEN`, and optionally `POCKETBASE_COLLECTION` (default `bench_records`). For an isolated benchmark instance, authenticate the supplied test superuser with `POST /api/collections/_superusers/auth-with-password` and keep only the returned token in ignored `.env`. Do not commit the source password or token.

Create a base collection with these fields:

| Field | Type | Required |
|---|---|---:|
| `benchId` | text | yes |
| `runId` | text | yes |
| `sequence` | number | **no** |
| `createdAt` | text | yes |
| `payload` | text | yes |

`sequence` must allow the numeric value zero; PocketBase treats zero as blank for a required number field. Add `CREATE INDEX idx_bench_records_runId ON bench_records (runId)`. Record IDs are deterministic 15-character PocketBase physical IDs derived from the logical UUID, while `benchId` retains the full logical ID.

The Records API has no generic bulk-create endpoint, so batch-write is reported as `not-supported`. Cleanup repeatedly fetches page 1 with an encoded `runId` filter and deletes only returned IDs.

```sh
npm run bench -- --provider pocketbase --dry-run
npm run bench -- --provider pocketbase --smoke-only --count 1 --batch-size 1
```

Official references, accessed 2026-08-28: [authentication](https://pocketbase.io/docs/authentication/), [collections API](https://pocketbase.io/docs/api-collections/), and [Records API](https://pocketbase.io/docs/api-records/).
