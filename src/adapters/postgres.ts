import { Pool } from 'pg';
import type { Adapter, LogicalRecord } from '../types.js';

export type Query = (sql: string, params?: unknown[], signal?: AbortSignal) => Promise<any>;
const safe = (table: string) => table.replace(/[^a-zA-Z0-9_]/g, '') || 'bench_records';

export function postgresAdapter(query: Query, table = 'bench_records', name = 'postgres'): Adapter {
  const ident = safe(table);
  const batch = async (rows: LogicalRecord[], signal?: AbortSignal) => {
    if (!rows.length) return;
    const values = rows.map((_, i) => `($${i * 5 + 1},$${i * 5 + 2},$${i * 5 + 3},$${i * 5 + 4},$${i * 5 + 5})`).join(',');
    await query(
      `INSERT INTO "${ident}" (id,run_id,sequence,created_at,payload) VALUES ${values}`,
      rows.flatMap(row => [row.id, row.runId, row.sequence, row.createdAt, row.payload]),
      signal,
    );
  };
  return {
    name,
    transport: 'direct',
    setup: async signal => {
      await query(`CREATE TABLE IF NOT EXISTS "${ident}" (id text PRIMARY KEY,run_id text NOT NULL,sequence integer NOT NULL,created_at timestamptz NOT NULL,payload text NOT NULL)`, [], signal);
      await query(`CREATE INDEX IF NOT EXISTS "${ident}_run_id_idx" ON "${ident}" (run_id)`, [], signal);
    },
    seed: batch,
    seedRequestCost: () => 1,
    read: async (id, signal) => {
      const result = await query(`SELECT id FROM "${ident}" WHERE id=$1`, [id], signal);
      if (!result?.rows?.length) throw new Error(`${name} read: record not found`);
    },
    insert: (row, signal) => batch([row], signal),
    batch,
    cleanup: (runId, signal) => query(`DELETE FROM "${ident}" WHERE run_id=$1`, [runId], signal).then(() => {}),
  };
}

export const postgresTimeoutConfig = (connectionString: string, timeoutMs: number) => ({
  connectionString,
  connectionTimeoutMillis: timeoutMs,
  query_timeout: timeoutMs,
  statement_timeout: timeoutMs,
});

export function pgAdapter(
  connectionString: string,
  mode: 'pool' | 'client' = 'pool',
  table = 'bench_records',
  name = 'postgres',
  timeoutMs = 10_000,
  maxConnections = 4,
): Adapter {
  const effectiveConnections = mode === 'client' ? 1 : Math.max(1, maxConnections);
  const pool = new Pool({ ...postgresTimeoutConfig(connectionString, timeoutMs), max: effectiveConnections });
  const query: Query = async (sql, params, signal) => {
    if (!connectionString) throw new Error(`${name}: missing database URL`);
    const client = await pool.connect();
    let destroyed = false;
    const abort = () => { destroyed = true; client.release(true); };
    signal?.addEventListener('abort', abort, { once: true });
    try {
      return await client.query(sql, params);
    } finally {
      signal?.removeEventListener('abort', abort);
      if (!destroyed) client.release();
    }
  };
  const adapter = postgresAdapter(query, table, name);
  adapter.endpoint = (() => { try { return new URL(connectionString).host; } catch { return 'unknown'; } })();
  adapter.metadata = { accessPath: mode, maxConnections: effectiveConnections };
  const setup = adapter.setup;
  adapter.setup = async signal => {
    if (!connectionString) throw new Error(`${name}: missing database URL`);
    await setup(signal);
  };
  const clean = adapter.cleanup;
  adapter.cleanup = async (runId, signal) => {
    try { await clean(runId, signal); } finally { await pool.end(); }
  };
  return adapter;
}
