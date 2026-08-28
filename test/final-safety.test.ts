import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeAdapter } from '../src/adapters/fake.js';
import { postgresAdapter, pgAdapter } from '../src/adapters/postgres.js';
import { trailbaseAdapter } from '../src/adapters/trailbase.js';
import { redact } from '../src/report.js';
import { run } from '../src/runner.js';
import { preflight } from '../src/safety.js';

test('preflight counts setup, per-record seed, smoke batch, and measured writes', () => {
  const result = preflight({
    durationSeconds: 1,
    concurrency: 1,
    requestsPerSecond: 10,
    ramps: [1],
    seedRecords: 100,
    seedRequests: 100,
    recordsPerRequest: 188,
    operations: 3,
    confirmStress: true,
  });
  assert.equal(result.requests, 134); // setup + seed + 3 smoke + 30 measured
  assert.equal(result.records, 2179); // seed + smoke single/batch + measured single/batch
});

test('non-cooperative setup times out and cleanup still runs', async () => {
  const adapter = fakeAdapter();
  let cleaned = false;
  adapter.setup = async () => new Promise<void>(() => {});
  adapter.cleanup = async () => { cleaned = true; };
  const result = await Promise.race([
    run(adapter, { timeoutMs: 5, count: 1, smokeOnly: true }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('run hung')), 100)),
  ]);
  assert.match(String((result as { error?: string }).error), /timeout/i);
  assert.equal(cleaned, true);
});

test('one global runtime budget caps all lifecycle and stage work', async () => {
  const adapter = fakeAdapter();
  let requests = 0;
  let written = 0;
  const setup = adapter.setup, seed = adapter.seed, read = adapter.read;
  const insert = adapter.insert, batch = adapter.batch;
  adapter.setup = async s => { requests++; await setup(s); };
  adapter.seed = async (rows, s) => { requests++; written += rows.length; await seed(rows, s); };
  adapter.read = async (id, s) => { requests++; await read(id, s); };
  adapter.insert = async (row, s) => { requests++; written++; await insert(row, s); };
  adapter.batch = async (rows, s) => { requests++; written += rows.length; await batch(rows, s); };

  await run(adapter, {
    count: 2,
    durationSeconds: .02,
    requestsPerSecond: 1000,
    ramps: [1, 2],
    batchSize: 10,
    timeoutMs: 20,
    maxRequests: 8,
    maxRecords: 15,
  });
  assert.ok(requests <= 8, `requests=${requests}`);
  assert.ok(written <= 15, `written=${written}`);
});

test('postgres setup creates cleanup index and pool metadata is explicit', async () => {
  const sql: string[] = [];
  const adapter = postgresAdapter(async statement => { sql.push(statement); return {}; });
  await adapter.setup();
  assert.match(sql.join('\n'), /CREATE INDEX IF NOT EXISTS .*run_id/i);

  const pooled = pgAdapter('postgresql://user:pass@db.example/test', 'pool', 'bench_records', 'postgres', 1000, 7);
  assert.deepEqual(pooled.metadata, { accessPath: 'pool', maxConnections: 7 });
});

test('redaction preserves ordinary text and strips embedded credential URLs', () => {
  assert.equal(redact('logical:id/runId; indexes:id,runId'), 'logical:id/runId; indexes:id,runId');
  assert.equal(redact('postgres: missing database URL'), 'postgres: missing database URL');
  assert.equal(redact('postgresql://user:secret@db.example/test'), 'db.example');
  assert.equal(redact('dial failed: postgresql://user:secret@db.example/db'), 'dial failed: db.example');
  assert.equal(redact('URL=https://user:secret@example.test/x'), 'URL=example.test');
});

test('TrailBase cleanup preserves already encoded record IDs', async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input);
    paths.push(new URL(url).pathname);
    return paths.length === 1
      ? new Response(JSON.stringify({ records: [{ id: 'Ej5FZ-ibQtOkVkJmFBdAAA' }] }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(null, { status: 204 });
  };
  try {
    await trailbaseAdapter('https://trail.example').cleanup('123e4567-e89b-42d3-a456-426614174000');
    assert.equal(paths[1], '/api/records/v1/bench_records/Ej5FZ-ibQtOkVkJmFBdAAA');
  } finally { globalThis.fetch = originalFetch; }
});

test('setup and cleanup use explicit request costs separate from workload stages', async () => {
  const adapter = fakeAdapter() as any;
  let requests = 0;
  let cleanupLimit: number | undefined;
  adapter.setupRequestCost = 2;
  adapter.setup = async () => { requests += 2; };
  for (const key of ['seed', 'read', 'insert', 'batch'] as const) {
    const original = adapter[key].bind(adapter);
    adapter[key] = async (...args: any[]) => { requests++; return original(...args); };
  }
  adapter.cleanup = async (_run: string, _signal?: AbortSignal, maxRequests?: number) => { cleanupLimit = maxRequests; };
  const result = await run(adapter, { count: 1, batchSize: 1, durationSeconds: .02, requestsPerSecond: 1000, maxRequests: 6, maxRecords: 10, maxCleanupRequests: 2 });
  assert.ok(requests <= 6, `requests=${requests}`);
  assert.equal(cleanupLimit, 2);
  assert.match(result.cleanup.retryCommand, /--max-cleanup-requests 2$/);
});
