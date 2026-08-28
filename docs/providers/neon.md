# Neon

API mode requires `NEON_DATA_API_URL`, `NEON_API_KEY`, and optional `NEON_TABLE`; the Data API receives parameterized SQL `{query,params}`. Direct mode uses `NEON_DATABASE_URL` (or `DATABASE_URL`) and `pg` Client; pooler mode uses `NEON_POOLER_URL` and `pg` Pool. The adapter creates the complete benchmark schema with a primary-key ID and `run_id` cleanup predicate.

Smoke: `npm run bench -- --provider neon-api --count 1 --duration 1 --ramps 1`, then use `neon-direct` or `neon-pooler` separately. Official docs: [Data API](https://neon.tech/docs/data-api/get-started), [connection](https://neon.tech/docs/connect/connect-from-any-app), [pricing/limits](https://neon.tech/pricing). Accessed 2026-08-28; check current plan limits before running.
