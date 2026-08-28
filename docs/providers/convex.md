# Convex

Required runtime variable: `CONVEX_URL`, using the target `.convex.cloud` deployment URL. The included root `convex.json`, `convex/schema.ts`, and `convex/bench.ts` define the benchmark table plus indexed read, single-write, batch-write, and run-scoped cleanup functions.

Deploy to the test development deployment with a scoped development deploy key:

```sh
# Put CONVEX_DEPLOY_KEY in ignored .env; never pass it on the command line.
npx convex dev --once
```

Create a scoped key with `npx convex deployment token create dev-platform-bench --deployment <deployment> --save-env .env` or through the Convex dashboard. Production deployments use `npx convex deploy`; do not deploy this benchmark to an unrelated production project.

The adapter calls built-in POST `/api/query` and `/api/mutation` with `{path,args,format}`. Optional function-path variables default to `bench:read`, `bench:insert`, `bench:batch`, and `bench:cleanup`.

```sh
npm run bench -- --provider convex --dry-run
npm run bench -- --provider convex --smoke-only --count 1 --batch-size 1
```

Official references, accessed 2026-08-28: [CLI](https://docs.convex.dev/cli), [deploy keys](https://docs.convex.dev/cli/deploy-key-types), [writing data](https://docs.convex.dev/database/writing-data), and [limits](https://docs.convex.dev/production/state/limits). Convex has no direct PostgreSQL mode.
