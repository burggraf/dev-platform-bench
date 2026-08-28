# Supabase

API mode requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or explicitly selected `SUPABASE_SERVICE_ROLE_KEY`) plus optional `SUPABASE_TABLE`. REST uses `/rest/v1/<table>`, primary-key filters for reads, JSON arrays for multi-row inserts, and a run-ID filter for cleanup. Configure RLS deliberately. Direct mode uses `SUPABASE_DIRECT_URL` with `pg` Client; pooler mode uses `SUPABASE_POOLER_URL` with `pg` Pool.

Smoke: `npm run bench -- --provider supabase-api --count 1 --duration 1 --ramps 1`; direct modes: `supabase-direct` and `supabase-pooler`. Official docs: [insert](https://supabase.com/docs/reference/javascript/insert), [API keys](https://supabase.com/docs/guides/api/api-keys), [REST](https://supabase.com/docs/guides/api). Accessed 2026-08-28; current quotas and plan limits must be checked before live work.
