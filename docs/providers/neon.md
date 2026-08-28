# Neon

API mode requires `NEON_DATA_API_URL`, `NEON_DATA_API_JWT`, and optional `NEON_TABLE`. It uses documented PostgREST `/rest/v1/<table>` paths, a dedicated JWT (`Authorization: Bearer`) authentication; never use a Neon management API key, primary-key filters, JSON inserts, and run-ID filters. Direct mode uses `NEON_DATABASE_URL` (or `DATABASE_URL`) with a `pg` Client; pooler mode uses `NEON_POOLER_URL` with a `pg` Pool. Create the benchmark table/schema before API smoke; direct setup creates it safely.

Smoke: `npm run bench -- --provider neon-api --count 1 --duration 1 --ramps 1`, then use `neon-direct` or `neon-pooler` separately. Official docs: [Neon Data API](https://neon.tech/docs/data-api/get-started), [connection](https://neon.tech/docs/connect/connect-from-any-app), [pricing](https://neon.tech/pricing). Accessed 2026-08-28; check current plan limits before live work.
