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

Implementation is in progress. See [the approved design](docs/plans/2026-08-28-read-write-throughput-design.md).
