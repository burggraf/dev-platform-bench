# Safety and recovery

Free-plan reference quotas (accessed 2026-08-28) are resource/monthly quotas, not RPS ceilings: Appwrite documents 500,000 reads and 250,000 writes monthly ([limits](https://appwrite.io/docs/advanced/platform/limits)); Convex documents 0.5 GB database, 1 GB database I/O, and 1 million function calls monthly ([pricing](https://www.convex.dev/pricing)); Neon documents 0.5 GB storage, 100 CU-hours, and 5 GB transfer ([pricing](https://neon.tech/pricing)); Supabase documents a 500 MB database and read-only threshold plus bandwidth quotas ([billing](https://supabase.com/docs/guides/platform/billing-onboarding)); PocketBase and TrailBase are self-hosted, so VPS/database limits apply rather than a provider free tier.

The committed profiles use 5–10 RPS, one-second stages, and concurrency 1–2 as a conservative smoke/ramp default, never as provider capacity claims. Review current Terms of Service and quota pages before every run.

## Checklist and recovery

Set one provider's environment variables, run `npm test`, then `npm run bench -- --provider MODE --dry-run`, and smoke with `--smoke-only`. Never commit tokens or connection strings. `--confirm-stress` is required for explicit overrides. Cleanup accepts only generated UUID run IDs, deletes only benchmark-owned records, and reports a retry command. After a failed cleanup, rerun that command and verify zero matching rows without widening the predicate.
