# Methodology

The suite uses deterministic records (1 KiB payload by default), generated IDs, a run ID, sequence, timestamp, and indexed point reads. The lifecycle is setup, seed, smoke, warmup (when a provider runner is used), measured stages, cooldown, and run-scoped cleanup. API and PostgreSQL direct modes are reported separately.

Percentiles use nearest-rank over successful request latency samples. Throughput is successful requests and logical records divided by declared stage seconds. A stage is unstable on any failed request in the minimal runner; provider runners should additionally classify timeout and throttle responses. Batch operations must report both request and record rates. Results are observations, not service limits.
