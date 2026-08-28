# Neon

API mode requires `NEON_DATA_API_URL`, a dedicated `NEON_DATA_API_JWT`, and optional `NEON_TABLE`. Enable Neon Data API for the branch and mint a JWT accepted by its configured JWKS/auth provider; a Neon management API key is not valid. Setup performs authenticated `GET /rest/v1/<table>?select=id,run_id,sequence,created_at,payload&limit=1` before seeding.

Create the API table first:
```sql
CREATE TABLE bench_records (id text PRIMARY KEY, run_id text NOT NULL, sequence integer NOT NULL, created_at timestamptz NOT NULL, payload text NOT NULL);
CREATE INDEX bench_records_run_id_idx ON bench_records(run_id);
```
Grant the JWT role only required select/insert/delete privileges and apply RLS deliberately. API calls use PostgREST and `Authorization: Bearer`. Direct mode uses `NEON_DATABASE_URL`; pooler mode uses `NEON_POOLER_URL`. Official: [Data API](https://neon.tech/docs/data-api/get-started), [connection](https://neon.tech/docs/connect/connect-from-any-app), accessed 2026-08-28.
