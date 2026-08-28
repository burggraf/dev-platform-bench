import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeAdapter } from '../src/adapters/fake.js';
import { postgresAdapter, pgAdapter } from '../src/adapters/postgres.js';
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

test('redaction preserves ordinary schema and error text', () => {
  assert.equal(redact('logical:id/runId; indexes:id,runId'), 'logical:id/runId; indexes:id,runId');
  assert.equal(redact('postgres: missing database URL'), 'postgres: missing database URL');
  assert.equal(redact('postgresql://user:secret@db.example/test'), 'db.example');
});
