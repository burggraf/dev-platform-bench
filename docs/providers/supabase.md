# Supabase

API mode uses `SUPABASE_URL` plus an anon or service key and the REST endpoint. Direct mode uses a PostgreSQL connection string with shared `pg`. Apply RLS intentionally and use a benchmark-owned table. Official references: https://supabase.com/docs/reference/javascript/insert and https://supabase.com/docs/guides/api/api-keys. Accessed 2026-08-28. Never expose service-role keys in client code or results.
