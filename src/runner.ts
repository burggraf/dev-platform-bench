import { randomUUID } from 'node:crypto';
import { record, records } from './records.js';
import { runStage, type StageOptions } from './stage.js';
import type { Adapter, RunBudget } from './types.js';

export type RunOptions = Partial<{
  count: number;
  payloadBytes: number;
  durationSeconds: number;
  concurrency: number;
  batchSize: number;
  requestsPerSecond: number;
  timeoutMs: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  ramps: number[];
  errorThreshold: number;
  throttleThreshold: number;
  signal: AbortSignal;
  smokeOnly: boolean;
  maxRequests: number;
  maxRecords: number;
  maxCleanupRequests: number;
}>;

type Cleanup = { status: 'ok' | 'failed' | 'timeout'; error: string | null; retryCommand: string; maxRequests: number };

const wait = (seconds: number, signal: AbortSignal) => new Promise<void>(resolve => {
  const timer = setTimeout(resolve, seconds * 1000);
  signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

async function bounded<T>(fn: (signal: AbortSignal) => Promise<T>, parent: AbortSignal, ms: number) {
  const controller = new AbortController();
  let timer: NodeJS.Timeout;
  let rejectBoundary: (error: Error) => void = () => {};
  const boundary = new Promise<never>((_, reject) => {
    rejectBoundary = reject;
    timer = setTimeout(() => { controller.abort(); reject(new Error('operation timeout')); }, ms);
  });
  const parentAbort = () => { controller.abort(); rejectBoundary(new Error('cancelled')); };
  parent.addEventListener('abort', parentAbort, { once: true });
  if (parent.aborted) parentAbort();
  const task = Promise.resolve().then(() => fn(controller.signal));
  task.catch(() => {}); // a non-cooperative adapter may settle after the boundary
  try {
    return await Promise.race([task, boundary]);
  } finally {
    clearTimeout(timer!);
    parent.removeEventListener('abort', parentAbort);
  }
}

async function cleanup(adapter: Adapter, runId: string, ms: number, maxRequests: number): Promise<Cleanup> {
  const controller = new AbortController();
  const retryCommand = `npm run bench -- --provider ${adapter.name} --cleanup-run ${runId} --max-cleanup-requests ${maxRequests}`;
  let timer: NodeJS.Timeout;
  try {
    await Promise.race([
      adapter.cleanup(runId, controller.signal, maxRequests),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('cleanup timeout')); }, ms);
      }),
    ]);
    return { status: 'ok', error: null, retryCommand, maxRequests };
  } catch (error) {
    return {
      status: controller.signal.aborted ? 'timeout' : 'failed',
      error: error instanceof Error ? error.message : 'cleanup failed',
      retryCommand,
      maxRequests,
    };
  } finally {
    clearTimeout(timer!);
  }
}

export async function run(adapter: Adapter, opts: RunOptions = {}) {
  const c = {
    count: 100, payloadBytes: 1024, durationSeconds: 1, concurrency: 1, batchSize: 100,
    requestsPerSecond: 0, timeoutMs: 10_000, warmupSeconds: 0, cooldownSeconds: 0,
    ramps: [1], errorThreshold: .1, throttleThreshold: 3, smokeOnly: false,
    maxRequests: 10_000, maxRecords: 100_000, maxCleanupRequests: 1000, ...opts,
    signal: opts.signal ?? new AbortController().signal,
  };
  const runId = randomUUID();
  const seeded = records(runId, c.count, c.payloadBytes);
  const results: any[] = [];
  const budget: RunBudget = { requestsRemaining: c.maxRequests, recordsRemaining: c.maxRecords };
  let unsupportedBatch = false;
  let thrown: unknown;

  const reserve = (requests: number, writtenRecords = 0) => {
    if (budget.requestsRemaining < requests) throw new Error('request budget exhausted');
    if (budget.recordsRemaining < writtenRecords) throw new Error('record budget exhausted');
    budget.requestsRemaining -= requests;
    budget.recordsRemaining -= writtenRecords;
  };

  try {
    reserve(adapter.setupRequestCost ?? 1);
    await bounded(signal => adapter.setup(signal), c.signal, c.timeoutMs);

    reserve(adapter.seedRequestCost?.(seeded.length) ?? 1, seeded.length);
    await bounded(signal => adapter.seed(seeded, signal), c.signal, c.timeoutMs);

    reserve(1);
    await bounded(signal => adapter.read(seeded[0].id, signal), c.signal, c.timeoutMs);

    reserve(1, 1);
    await bounded(signal => adapter.insert(record(runId, c.count + 1, c.payloadBytes), signal), c.signal, c.timeoutMs);

    reserve(1, c.batchSize);
    try {
      await bounded(
        signal => adapter.batch(Array.from({ length: c.batchSize }, (_, i) => record(runId, c.count + 2 + i, c.payloadBytes)), signal),
        c.signal,
        c.timeoutMs,
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('not-supported')) unsupportedBatch = true;
      else throw error;
    }

    if (!c.smokeOnly) {
      if (c.warmupSeconds) {
        await runStage(adapter, 'read', seeded, {
          durationSeconds: c.warmupSeconds, concurrency: c.concurrency,
          requestsPerSecond: c.requestsPerSecond || c.concurrency * 10,
          timeoutMs: c.timeoutMs, signal: c.signal, budget,
        });
      }
      for (let i = 0; i < c.ramps.length; i++) {
        const concurrency = c.ramps[i];
        const stage: StageOptions = {
          durationSeconds: c.durationSeconds, concurrency, batchSize: c.batchSize,
          requestsPerSecond: c.requestsPerSecond || concurrency * 10,
          timeoutMs: c.timeoutMs, errorThreshold: c.errorThreshold,
          throttleThreshold: c.throttleThreshold, signal: c.signal, budget,
        };
        for (const operation of ['read', 'single-write', 'batch-write'] as const) {
          if (operation === 'batch-write' && unsupportedBatch) {
            results.push({ operation, targetConcurrency: concurrency, stable: true, stopReason: 'not-supported', unsupported: 1 });
            continue;
          }
          const result = await runStage(adapter, operation, seeded, stage);
          results.push({ operation, targetConcurrency: concurrency, ...result });
          if (!result.stable) break;
        }
        if (results.at(-1)?.stable === false) break;
        if (i < c.ramps.length - 1 && c.cooldownSeconds) await wait(c.cooldownSeconds, c.signal);
      }
    }
  } catch (error) {
    thrown = error;
  }

  const cleanupResult = await cleanup(adapter, runId, Math.min(c.timeoutMs, 5000), c.maxCleanupRequests);
  const environment = {
    node: process.version,
    runnerLocation: process.env.RUNNER_LOCATION ?? 'unknown',
    providerRegion: process.env.PROVIDER_REGION ?? 'unknown',
    providerTier: process.env.PROVIDER_TIER ?? 'unknown',
    vpsSpecs: process.env.VPS_SPECS ?? 'unknown',
    testDate: new Date().toISOString(),
    schema: process.env.BENCH_SCHEMA ?? 'logical:id/runId/sequence/createdAt/payload; indexes:id,runId',
  };
  const common = {
    runId, provider: adapter.name, transport: adapter.transport, endpoint: adapter.endpoint,
    adapterConfig: adapter.metadata, environment, settings: c, budgetRemaining: budget,
    results, cleanup: cleanupResult,
  };
  return thrown
    ? { ...common, error: thrown instanceof Error ? thrown.message : 'benchmark failed' }
    : common;
}

export async function runWithSignals(adapter: Adapter, opts: RunOptions = {}) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    return await run(adapter, { ...opts, signal: controller.signal });
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}
