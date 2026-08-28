# Read/Write Throughput Suite Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Build and document a safety-bounded TypeScript benchmark suite for API and available direct-database read, single-write, and batch-write paths across six development platforms.

**Architecture:** A shared CLI runs bounded stages against thin provider adapters and emits canonical JSON plus Markdown summaries. Provider setup and cleanup remain adapter-owned; metrics, budgets, throttling stops, secret sanitization, and workload generation remain shared.

**Tech Stack:** Node.js 22+, TypeScript, Node test runner, built-in `fetch`, official provider clients only where a wire API is impractical, and `pg` for PostgreSQL connections.

## Execution status — 2026-08-28

- [x] Tasks 1–8 implemented and pushed to `main`.
- [x] Task 9 implementation verification completed: 53 tests pass, typecheck/build pass, credential audit clean, independent review has no Critical findings, and `main` is synchronized with `origin/main`.
- [ ] Optional final reproducibility check: run `npm ci` from a fresh checkout, then repeat the verification commands.
- [x] Live smoke + cleanup passed: Appwrite, Convex, Neon Data API, Neon direct, Neon pooler, PocketBase, Supabase API, Supabase pooler, and TrailBase.
- [x] Conservative baseline matrix passed all 9 tested modes; archived in ignored `results/baseline-matrix.json` plus per-run `result-<runId>.json` files.
- [x] Every future run now archives immutable JSON and Markdown reports; `result.json` and `summary.md` remain latest aliases.
- [ ] Supabase direct remains excluded because the direct database hostname is unreachable; use Supavisor instead.
- [ ] Throughput expansion remains optional and requires a deliberate run decision; no stress overrides have been used.

**Restart point:** read this status block, inspect `results/baseline-matrix.json`, then choose either a longer controlled baseline or an explicitly confirmed higher-concurrency run. Do not rerun the completed setup/smoke work unless credentials or provider resources change.

---

### Task 1: Secure repository bootstrap

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Create: `.env.example`
- Create: `SECURITY.md`

**Steps:**
1. Initialize Git on `main` and verify every existing credential/export file is ignored with `git status --ignored`.
2. Search tracked candidates for URLs with embedded credentials, JWTs, API keys, passwords, and provider secret prefixes.
3. Commit only `.gitignore`, README, design, and plan.
4. Create `burggraf/dev-platform-bench` as a public GitHub repository with `gh repo create`, add `origin`, and push `main`.
5. Verify GitHub visibility and tracked files with `gh repo view` and `git ls-files`.

### Task 2: Shared types, metrics, and deterministic records (TDD)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/types.ts`
- Create: `src/metrics.ts`
- Create: `src/records.ts`
- Create: `test/metrics.test.ts`
- Create: `test/records.test.ts`

**Steps:**
1. Write failing Node tests for nearest-rank p50/p95/p99, request/record rates, empty samples, deterministic payload size, and unique IDs.
2. Run `npm test`; confirm failures are caused by missing modules.
3. Implement the smallest pure functions and shared adapter/result types.
4. Run `npm test`; confirm all tests pass.
5. Commit.

### Task 3: Safety budgets and bounded stage runner (TDD)

**Files:**
- Create: `src/safety.ts`
- Create: `src/stage.ts`
- Create: `src/profiles.ts`
- Create: `test/safety.test.ts`
- Create: `test/stage.test.ts`

**Steps:**
1. Write failing tests proving over-budget configurations are rejected without `--confirm-stress`, explicit overrides require confirmation, concurrency is bounded, unstable stages stop escalation, and throttling is not aggressively retried.
2. Run focused tests and confirm expected failures.
3. Implement immutable conservative profiles, preflight budget calculation, worker-based stage execution, optional request pacing, latency collection, and threshold decisions.
4. Run focused and full tests.
5. Commit.

### Task 4: Fake adapter and CLI lifecycle (TDD)

**Files:**
- Create: `src/adapters/fake.ts`
- Create: `src/runner.ts`
- Create: `src/cli.ts`
- Create: `test/runner.test.ts`

**Steps:**
1. Write a failing end-to-end test for validate → setup → seed → smoke → warmup → measured stages → cleanup and for cleanup after a measured-stage error.
2. Run the test and confirm the lifecycle is missing.
3. Implement minimal CLI parsing with Node `util.parseArgs`, adapter selection, lifecycle orchestration, unique run IDs, and signal-safe cleanup.
4. Run all tests.
5. Commit.

### Task 5: PostgreSQL direct adapter (TDD + local fake boundary)

**Files:**
- Create: `src/adapters/postgres.ts`
- Create: `test/postgres.test.ts`
- Modify: `package.json`

**Steps:**
1. Write failing tests around SQL generation, parameterization, batch sizing, run-scoped cleanup, and sanitized errors using a recording query function rather than a real provider.
2. Implement one `pg` adapter reused by Neon and Supabase direct/pooler modes.
3. Ensure inserts use parameterized multi-row SQL and reads use indexed primary keys.
4. Run tests and typecheck.
5. Commit.

### Task 6: Research and implement API adapters

**Files:**
- Create: `src/adapters/appwrite.ts`
- Create: `src/adapters/convex.ts`
- Create: `src/adapters/neon.ts`
- Create: `src/adapters/pocketbase.ts`
- Create: `src/adapters/supabase.ts`
- Create: `src/adapters/trailbase.ts`
- Create: provider-side Convex functions under `convex/` if required
- Create: `test/adapters.test.ts`
- Modify: `package.json`

**Steps:**
1. Consult current official documentation for authentication, collection/table setup, point reads, inserts, transactional/bulk inserts, delete filters, response status, and rate-limit signals.
2. Record official documentation links and access dates in provider setup docs.
3. Write failing contract tests for request shape, records-per-request accounting, unsupported direct modes, sanitized errors, and run-scoped cleanup.
4. Implement the smallest adapter for each public API, using built-in `fetch` where practical and a first-party SDK only when it materially reduces provider-specific protocol code.
5. Run contract tests without real credentials.
6. Run one explicitly selected provider smoke test at a time; never run measured load during verification.
7. Commit, excluding provider-generated secret/config files.

### Task 7: Results and reporting (TDD)

**Files:**
- Create: `src/report.ts`
- Create: `test/report.test.ts`
- Modify: `src/cli.ts`

**Steps:**
1. Write failing tests for canonical JSON, Markdown tables, API/direct separation, environment metadata, and secret redaction.
2. Implement JSON writing and Markdown generation with built-in filesystem APIs.
3. Ensure results default to ignored `results/` and contain endpoint hosts only.
4. Run tests.
5. Commit.

### Task 8: Thorough operating documentation

**Files:**
- Modify: `README.md`
- Create: `docs/methodology.md`
- Create: `docs/safety.md`
- Create: `docs/results.md`
- Create: `docs/providers/appwrite.md`
- Create: `docs/providers/convex.md`
- Create: `docs/providers/neon.md`
- Create: `docs/providers/pocketbase.md`
- Create: `docs/providers/supabase.md`
- Create: `docs/providers/trailbase.md`

**Steps:**
1. Document exact install, setup, smoke, benchmark, cleanup, and publication procedures.
2. Document payload/schema, seed count, batch semantics, stage sequence, warmup/cooldown, stability thresholds, percentile method, failure handling, caveats, and result interpretation.
3. Cite official free-tier limits where documented; label all assumptions; include access dates.
4. Include a pre-run checklist and post-run cleanup verification checklist.
5. Verify every command with `--help` or a no-credential dry run.
6. Commit.

### Task 9: Final security and correctness verification

**Files:**
- Modify only as required by findings.

**Steps:**
1. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` from a clean checkout/worktree.
2. Run CLI help, dry-run budget output, and fake-adapter smoke flow.
3. Audit all tracked files and Git history for credential patterns and private endpoint values.
4. Verify no real-provider load test runs in CI or normal tests.
5. Request code review against the approved design; fix Critical and Important findings.
6. Re-run the full verification suite.
7. Push the implementation branch and merge only after verification.
