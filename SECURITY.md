# Security

Use environment variables for credentials. Never commit `.env`, provider exports, connection strings, API keys, JWTs, or benchmark results. The CLI defaults to the fake adapter and finite low limits. Real operations require explicit provider configuration; stress overrides require `--confirm-stress` and numeric overrides. Do not run load tests against live accounts during development. Cleanup is scoped to the generated run ID; verify provider-side cleanup manually after smoke tests.
