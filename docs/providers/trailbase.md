# TrailBase

Set `TRAILBASE_URL`, `TRAILBASE_BEARER_TOKEN`, and `TRAILBASE_API_NAME`. Obtain a bearer token through the deployment's test-account login and keep it only in ignored environment configuration. Setup rejects missing authentication.

Create a strict benchmark table/API with UUID primary key `id`, plus `runId`, `sequence`, `createdAt`, and `payload`; index `runId`. The payload stores the canonical UUID. TrailBase record URLs encode the UUID bytes as unpadded URL-safe base64, so point reads and deletes use:

```text
/api/records/v1/{api_name}/{base64url_uuid}
```

Batch writes remain explicitly `not-supported` until this deployment's transaction endpoint has been separately verified. Cleanup repeatedly fetches offset zero using the exact encoded `filter[runId][$eq]` predicate, then deletes only IDs returned by that query.

```sh
npm run bench -- --provider trailbase --dry-run
npm run bench -- --provider trailbase --smoke-only
```

Official references, accessed 2026-08-28: [Record APIs](https://trailbase.io/documentation/apis_record/), [record transactions operation](https://trailbase.io/api/operations/record_transactions_handler/), and [type safety](https://trailbase.io/documentation/type_safety/). SQLite-file direct mode is outside v1 because it is not a comparable local-client network path.
