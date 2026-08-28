import { appwriteAdapter } from './adapters/appwrite.js';
import { convexAdapter } from './adapters/convex.js';
import { neonApiAdapter } from './adapters/neon.js';
import { pocketbaseAdapter } from './adapters/pocketbase.js';
import { supabaseApiAdapter } from './adapters/supabase.js';
import { trailbaseAdapter } from './adapters/trailbase.js';
import { pgAdapter } from './adapters/postgres.js';
import { fakeAdapter } from './adapters/fake.js';
import type { Adapter } from './types.js';

export type AdapterOptions = { timeoutMs?: number; maxConnections?: number };

export function getAdapter(mode: string, options: AdapterOptions = {}): Adapter {
  const timeout = options.timeoutMs ?? 10_000;
  const max = options.maxConnections ?? 4;
  switch (mode) {
    case 'fake': return selected(mode, fakeAdapter());
    case 'appwrite': return selected(mode, appwriteAdapter());
    case 'convex': return selected(mode, convexAdapter());
    case 'neon-api': return selected(mode, neonApiAdapter());
    case 'pocketbase': return selected(mode, pocketbaseAdapter());
    case 'supabase-api': return selected(mode, supabaseApiAdapter());
    case 'trailbase': return selected(mode, trailbaseAdapter());
    case 'neon-direct': return selected(mode, pgAdapter(required('NEON_DATABASE_URL') || required('DATABASE_URL'), 'client', 'bench_records', 'neon-direct', timeout, 1));
    case 'neon-pooler': return selected(mode, pgAdapter(required('NEON_POOLER_URL') || required('DATABASE_URL'), 'pool', 'bench_records', 'neon-pooler', timeout, max));
    case 'supabase-direct': return selected(mode, pgAdapter(required('SUPABASE_DIRECT_URL') || required('DATABASE_URL'), 'client', 'bench_records', 'supabase-direct', timeout, 1));
    case 'supabase-pooler': return selected(mode, pgAdapter(required('SUPABASE_POOLER_URL') || required('DATABASE_URL'), 'pool', 'bench_records', 'supabase-pooler', timeout, max));
    default: throw new Error(`unknown provider mode: ${mode}`);
  }
}

function selected(mode: string, adapter: Adapter) { adapter.mode = mode; return adapter; }
function required(name: string) { return process.env[name] ?? ''; }
