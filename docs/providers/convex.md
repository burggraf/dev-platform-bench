# Convex

Required variable: `CONVEX_SITE_URL`. Deploy benchmark-owned HTTP actions for read, insert, batch, and run-ID cleanup; set optional `CONVEX_READ_PATH`, `CONVEX_INSERT_PATH`, `CONVEX_BATCH_PATH`, and `CONVEX_CLEANUP_PATH`. Actions should validate the logical record and use a transaction for batch semantics. Convex has no direct PostgreSQL mode.

Smoke: `npm run bench -- --provider convex --count 1 --duration 1 --ramps 1`. Confirm the deployed action's auth and cleanup behavior before any ramp. Official docs: [writing data](https://docs.convex.dev/database/writing-data), [HTTP actions](https://docs.convex.dev/http-actions), [limits](https://docs.convex.dev/production/state/limits). Accessed 2026-08-28; limits remain provider-plan documentation, not assumptions embedded in this suite.
