# dev-platform-bench

Reproducible, safety-bounded benchmarks for major development data platforms:

- Appwrite
- Convex
- Neon
- PocketBase
- Supabase
- TrailBase

The first suite measures indexed point-read throughput, individual-write throughput, and batched-write throughput through public APIs and, where providers expose it, direct database or pooler connections.

> This project targets real free-tier accounts. Load tests must respect provider terms, quotas, and the repository's safety policy. “Maximum” means the highest stable stage observed under the documented test procedure—not absolute provider capacity.

## Quick start

Requires Node.js 22.9 or newer (for native optional `.env` loading).

```sh
npm ci
npm test
npm run typecheck
npm run bench -- --help
npm run bench -- --provider fake --count 10
```

The default fake run is safe and writes ignored files under `results/`. Copy `.env.example` to the ignored `.env`; `npm run bench` loads it with Node's native env-file support. See `SECURITY.md` and [safety](docs/safety.md). Real provider smoke commands must be run one provider at a time after setup; never use live accounts for normal tests or unbounded load. See [methodology](docs/methodology.md), [results](docs/results.md), and provider setup notes.

See [the approved design](docs/plans/2026-08-28-read-write-throughput-design.md).
