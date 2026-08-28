import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { percentile, rates } from './metrics.js';
import type { Adapter, LogicalRecord, Operation, RunBudget } from './types.js';

export type StageOptions = {
  durationSeconds?: number;
  concurrency?: number;
  batchSize?: number;
  requestsPerSecond?: number;
  timeoutMs?: number;
  errorThreshold?: number;
  throttleThreshold?: number;
  signal?: AbortSignal;
  maxRequests?: number;
  maxRecords?: number;
  budget?: RunBudget;
};

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>(resolve => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

export async function runStage(
  adapter: Adapter,
  operation: Operation,
  items: LogicalRecord[],
  options: StageOptions | number = 1,
  legacyConcurrency = 1,
) {
  const o = typeof options === 'number' ? { durationSeconds: options, concurrency: legacyConcurrency } : options;
  const duration = o.durationSeconds ?? 1;
  const concurrency = Math.max(1, o.concurrency ?? 1);
  const batchSize = Math.max(1, o.batchSize ?? 100);
  const timeout = o.timeoutMs ?? 10_000;
  const start = performance.now();
  const deadline = start + duration * 1000;
  const controller = new AbortController();
  const budget = o.budget ?? {
    requestsRemaining: o.maxRequests ?? Infinity,
    recordsRemaining: o.maxRecords ?? Infinity,
  };

  let cancelled = false;
  let reason = 'duration';
  const cancel = () => { cancelled = true; reason = 'cancelled'; controller.abort(); };
  o.signal?.addEventListener('abort', cancel, { once: true });
  if (o.signal?.aborted) cancel();

  let cursor = 0;
  let attempted = 0;
  let success = 0;
  let failed = 0;
  let throttled = 0;
  let unsupported = 0;
  let nextAllowed = 0;
  const latencies: number[] = [];
  const errors: Record<string, number> = {};

  const next = () => {
    const source = items[cursor++ % items.length];
    return operation === 'read' ? source : { ...source, id: randomUUID(), createdAt: new Date().toISOString() };
  };

  const reserve = () => {
    const records = operation === 'read' ? 0 : operation === 'batch-write' ? batchSize : 1;
    if (budget.requestsRemaining < 1) { reason = 'request-budget'; controller.abort(); return false; }
    if (budget.recordsRemaining < records) { reason = 'record-budget'; controller.abort(); return false; }
    budget.requestsRemaining--;
    budget.recordsRemaining -= records;
    return true;
  };

  async function call(item: LogicalRecord | LogicalRecord[]) {
    const task = operation === 'read'
      ? adapter.read((item as LogicalRecord).id, controller.signal)
      : operation === 'single-write'
        ? adapter.insert(item as LogicalRecord, controller.signal)
        : adapter.batch(item as LogicalRecord[], controller.signal);
    task.catch(() => {});
    let timer: NodeJS.Timeout;
    return new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => { reason = 'timeout'; controller.abort(); reject(new Error('timeout')); }, timeout);
      task.then(resolve, reject);
    }).finally(() => clearTimeout(timer));
  }

  async function worker() {
    while (!controller.signal.aborted && performance.now() < deadline) {
      if (o.requestsPerSecond) {
        const gap = 1000 / o.requestsPerSecond;
        const now = performance.now();
        const waitFor = Math.max(0, nextAllowed - now);
        nextAllowed = Math.max(nextAllowed, now) + gap;
        if (waitFor) await sleep(waitFor, controller.signal);
      }
      if (controller.signal.aborted || performance.now() >= deadline || !reserve()) break;

      const batch = operation === 'batch-write' ? Array.from({ length: batchSize }, next) : [next()];
      attempted++;
      const requestStart = performance.now();
      try {
        await call(operation === 'batch-write' ? batch : batch[0]);
        success++;
        latencies.push(performance.now() - requestStart);
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : 'error';
        const key = /not-supported/i.test(message) ? 'not-supported'
          : /throttl|rate.?limit|429/i.test(message) ? 'throttle'
            : /timeout|abort/i.test(message) ? 'timeout' : 'error';
        errors[key] = (errors[key] ?? 0) + 1;
        if (key === 'not-supported') { unsupported++; reason = 'not-supported'; controller.abort(); break; }
        if (key === 'throttle' && ++throttled >= (o.throttleThreshold ?? 1)) { reason = 'throttle-threshold'; controller.abort(); break; }
        if (key === 'timeout') { reason = 'timeout'; controller.abort(); break; }
        if (attempted >= 10 && failed / attempted >= (o.errorThreshold ?? 1)) { reason = 'error-threshold'; controller.abort(); break; }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  o.signal?.removeEventListener('abort', cancel);
  const elapsedSeconds = Math.max((performance.now() - start) / 1000, .001);
  const logicalRecords = success * (operation === 'batch-write' ? batchSize : 1);
  const errorRate = failed / Math.max(1, attempted);
  const budgetStopped = reason === 'request-budget' || reason === 'record-budget';
  const stable = !cancelled && !unsupported && !budgetStopped && throttled < (o.throttleThreshold ?? 1)
    && (errors.timeout ?? 0) === 0 && errorRate < (o.errorThreshold ?? 1);
  if (reason === 'duration' && !stable) reason = throttled >= (o.throttleThreshold ?? 1)
    ? 'throttle-threshold' : errors.timeout ? 'timeout' : 'error-threshold';

  return {
    attempted, success, failed, records: logicalRecords, batchSize, elapsedSeconds,
    ...rates({ requests: success, records: logicalRecords, seconds: elapsedSeconds }),
    p50: percentile(latencies, .5), p95: percentile(latencies, .95), p99: percentile(latencies, .99),
    timeouts: errors.timeout ?? 0, throttled, unsupported, errors, stable, stopReason: reason,
  };
}
