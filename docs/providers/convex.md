# Convex

Set `CONVEX_SITE_URL` and deploy explicit benchmark query/mutation functions before selecting Convex. Convex is adapter-owned RPC, not direct PostgreSQL. Official references: https://docs.convex.dev/database/writing-data and https://docs.convex.dev/production/state/limits. Accessed 2026-08-28. Do not infer batch support from a client loop; deploy and document the mutation's transaction semantics.
