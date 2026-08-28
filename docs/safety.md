# Safety

Defaults are intentionally bounded: fake runs only, finite record count, one-second stages, and low concurrency. Never use live credentials for load testing. Provider smoke tests should perform setup, one read, one insert, one batch insert, and cleanup only.

Before running: review provider terms, region, quotas, schema, and credentials; use a unique run ID; confirm cleanup. `--confirmStress` is required when configured concurrency, duration, or request volume exceeds conservative limits. Do not use it to bypass provider rate limits. After running, verify that only benchmark-owned records were removed and retain result metadata without secrets.
