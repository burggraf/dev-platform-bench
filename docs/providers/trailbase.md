# TrailBase

Required variable: `TRAILBASE_URL`; optional `TRAILBASE_COLLECTION` defaults to `bench_records`. Configure a Records table with logical fields and an indexed ID/run ID. The Records API path is `/api/records/<collection>`; verify deployment auth and its transaction/batch endpoint before selecting batch-write. If no true bulk endpoint is configured, the adapter reports not-supported.

Smoke: `npm run bench -- --provider trailbase --count 1 --duration 1 --ramps 1`. Official docs: [documentation](https://trailbase.io/documentation/), [API](https://trailbase.io/documentation/api/). Accessed 2026-08-28. SQLite direct mode is out of scope; VPS profiles remain conservative assumptions.
