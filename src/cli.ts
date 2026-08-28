import { parseArgs } from 'node:util';
import { getAdapter } from './providers.js';
import { runWithSignals } from './runner.js';
import { redact, writeReport } from './report.js';
import { preflight } from './safety.js';
import { profiles } from './profiles.js';
import { isUuid } from './records.js';

const modes = ['fake', 'appwrite', 'convex', 'neon-api', 'pocketbase', 'supabase-api', 'trailbase', 'neon-direct', 'neon-pooler', 'supabase-direct', 'supabase-pooler'];
const { values } = parseArgs({ options: {
  provider: { type: 'string', default: 'fake' },
  count: { type: 'string', default: '100' },
  duration: { type: 'string' },
  concurrency: { type: 'string' },
  'requests-per-second': { type: 'string' },
  'batch-size': { type: 'string', default: '100' },
  'warmup-seconds': { type: 'string', default: '0' },
  'cooldown-seconds': { type: 'string' },
  'timeout-ms': { type: 'string', default: '1000' },
  ramps: { type: 'string' },
  'max-requests': { type: 'string', default: '10000' },
  'max-records': { type: 'string' },
  'max-cleanup-requests': { type: 'string', default: '1000' },
  'confirm-stress': { type: 'boolean', default: false },
  'dry-run': { type: 'boolean', default: false },
  'smoke-only': { type: 'boolean', default: false },
  'cleanup-run': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} });

if (values.help) {
  console.log(`Usage: npm run bench -- --provider MODE [--smoke-only] [--dry-run] [--confirm-stress]\nModes: ${modes.join(', ')}`);
  process.exit(0);
}

const provider = String(values.provider);
if (!modes.includes(provider)) throw new Error(`unknown provider: ${provider}`);
const profile = profiles[provider] ?? profiles.direct;
const number = (value: unknown) => Number(value);
const count = number(values.count);
const duration = number(values.duration ?? profile.durationSeconds);
const concurrency = number(values.concurrency ?? profile.concurrency[0]);
const rps = number(values['requests-per-second'] ?? profile.requestsPerSecond);
const batchSize = number(values['batch-size']);
const warmup = number(values['warmup-seconds']);
const cooldown = number(values['cooldown-seconds'] ?? profile.cooldownSeconds);
const timeout = number(values['timeout-ms']);
const ramps = String(values.ramps ?? profile.concurrency).split(',').map(Number);
const maxRequests = number(values['max-requests']);
const maxRecords = number(values['max-records'] ?? profile.maxRecords);
const maxCleanupRequests = number(values['max-cleanup-requests']);
const confirm = Boolean(values['confirm-stress']);
const adapter = getAdapter(provider, { timeoutMs: timeout, maxConnections: Math.max(...ramps) });
if (values['cleanup-run']) {
  if (!isUuid(String(values['cleanup-run']))) throw new Error('cleanup run ID must be a generated UUID');
  await adapter.cleanup(String(values['cleanup-run']), AbortSignal.timeout(timeout), maxCleanupRequests);
  console.log('cleanup ok');
  process.exit(0);
}
if (provider !== 'fake' && rps === 0 && !confirm) throw new Error('zero requests-per-second requires --confirm-stress for live providers');

const perRecordSeed = ['appwrite', 'convex', 'pocketbase', 'trailbase'].includes(provider);
const budget = preflight({
  durationSeconds: duration,
  concurrency,
  requestsPerSecond: rps,
  recordsPerRequest: batchSize,
  ramps,
  cooldownSeconds: cooldown,
  maxRequests,
  maxRecords,
  maxRunSeconds: profile.maxRunSeconds,
  seedRecords: count,
  warmupSeconds: warmup,
  operations: 3,
  requestTimeoutSeconds: timeout / 1000,
  seedRequests: perRecordSeed ? count : 1,
  setupRequests: provider.endsWith('-direct') || provider.endsWith('-pooler') ? 2 : 1,
  maxCleanupRequests,
  smokeOnly: Boolean(values['smoke-only']),
  confirmStress: confirm,
});
if (values['dry-run']) {
  console.log(JSON.stringify({ provider, profile, budget }, null, 2));
  process.exit(0);
}

const runOptions = {
  count,
  payloadBytes: 1024,
  durationSeconds: duration,
  concurrency,
  batchSize,
  requestsPerSecond: rps || concurrency * 10,
  warmupSeconds: warmup,
  cooldownSeconds: cooldown,
  timeoutMs: timeout,
  ramps,
  errorThreshold: .1,
  throttleThreshold: 3,
  maxRequests,
  maxRecords,
  maxCleanupRequests,
  smokeOnly: Boolean(values['smoke-only']),
};
try {
  const result = await runWithSignals(adapter, runOptions);
  await writeReport(result);
  console.log(JSON.stringify(redact(result), null, 2));
  if ((result as any).error) process.exitCode = 1;
} catch (error) {
  const failure = {
    provider,
    transport: adapter.transport,
    endpoint: adapter.endpoint,
    error: error instanceof Error ? error.message : 'benchmark failed',
    environment: {
      node: process.version,
      runnerLocation: process.env.RUNNER_LOCATION ?? 'unknown',
      providerRegion: process.env.PROVIDER_REGION ?? 'unknown',
      providerTier: process.env.PROVIDER_TIER ?? 'unknown',
      vpsSpecs: process.env.VPS_SPECS ?? 'unknown',
      testDate: new Date().toISOString(),
    },
  };
  await writeReport(failure);
  console.log(JSON.stringify(redact(failure), null, 2));
  process.exitCode = 1;
}
