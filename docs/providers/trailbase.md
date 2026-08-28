# TrailBase

Set `TRAILBASE_URL`, `TRAILBASE_BEARER_TOKEN`, and `TRAILBASE_API_NAME` (default `bench_records`). Obtain the bearer token from `POST /api/auth/v1/login` with `response_type: "token"` and keep credentials/tokens only in ignored local configuration.

Create a strict `bench_records` table with:

- `id BLOB PRIMARY KEY NOT NULL CHECK(is_uuid(id))`
- `runId BLOB NOT NULL CHECK(is_uuid(runId))`
- `sequence INTEGER NOT NULL`
- `createdAt TEXT NOT NULL`
- `payload TEXT NOT NULL`
- index `idx_bench_records_runId` on `runId`

Expose it as the `bench_records` Record API with authenticated `CREATE`, `READ`, `UPDATE`, `DELETE`, and `SCHEMA` permissions. The benchmark does not require world access.

This deployed TrailBase version returns and accepts UUID BLOBs as **padded** URL-safe base64. Point reads, filters, and deletes therefore use the 24-character representation (22 data characters plus `==`), with padding percent-encoded in URL paths and queries:

```text
/api/records/v1/{api_name}/{base64url_uuid}%3D%3D
```

Batch writes remain explicitly `not-supported` until the deployment's transaction endpoint has been separately verified. Cleanup converts `runId` to the same padded representation, repeatedly fetches offset zero with `filter[runId][$eq]`, and deletes only IDs returned by that query.

```sh
npm run bench -- --provider trailbase --dry-run
npm run bench -- --provider trailbase --smoke-only --count 1 --batch-size 1
```

The installed `trail mcp` server can target a remote instance with serialized admin tokens via its `TOKENS` environment variable. Keep that token JSON in local MCP configuration and reload Pi after changing the server definition.

Official references, accessed 2026-08-28: [Record APIs](https://trailbase.io/documentation/apis_record/), [authentication](https://trailbase.io/documentation/auth/), and [record transactions](https://trailbase.io/api/operations/record_transactions_handler/). SQLite-file direct mode is outside v1 because it is not a comparable local-client network path.
