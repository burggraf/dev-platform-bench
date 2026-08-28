# TrailBase

Required variable: `TRAILBASE_URL`; set `TRAILBASE_API_NAME` (or legacy `TRAILBASE_COLLECTION`). Requests use the documented `/api/records/v1/{api_name}` route. Configure a Records API with logical fields and indexed ID/run ID. TrailBase transaction/bulk semantics vary by deployment; this adapter deliberately reports batch-write as `not-supported` rather than claiming a bulk operation it cannot verify.

Smoke: `npm run bench -- --provider trailbase --count 1 --duration 1 --ramps 1`. Cleanup lists/filter records for the run ID and deletes only returned IDs; verify pagination for deployments exceeding one page. Official docs: [documentation](https://trailbase.io/documentation/), [API](https://trailbase.io/documentation/api/). Accessed 2026-08-28. SQLite direct mode is out of scope.
