export type SafetyConfig = {
  durationSeconds: number;
  concurrency: number;
  requestsPerSecond: number;
  confirmStress?: boolean;
  maxRequests?: number;
  recordsPerRequest?: number;
  ramps?: number[];
  cooldownSeconds?: number;
  maxRunSeconds?: number;
  maxRecords?: number;
  seedRecords?: number;
  warmupSeconds?: number;
  operations?: number;
  requestTimeoutSeconds?: number;
  seedRequests?: number;
  setupRequests?: number;
  maxCleanupRequests?: number;
  smokeOnly?: boolean;
};

export function preflight(c: SafetyConfig) {
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  const nonnegative = (n: number) => Number.isFinite(n) && n >= 0;
  const integer = (n: number) => positive(n) && Number.isInteger(n);
  const batch = c.recordsPerRequest ?? 1;
  const seed = c.seedRecords ?? 100;
  const seedRequests = c.seedRequests ?? seed; // conservative for API adapters
  const setupRequests = c.setupRequests ?? 1;
  const warmupSeconds = c.warmupSeconds ?? 0;
  const cooldownSeconds = c.cooldownSeconds ?? 0;
  const timeoutSeconds = c.requestTimeoutSeconds ?? 0;
  const operations = c.operations ?? 3;
  const ramps = c.ramps ?? [c.concurrency];
  const maxRequests = c.maxRequests ?? 10_000;
  const maxCleanupRequests = c.maxCleanupRequests ?? 1000;

  if (
    !positive(c.durationSeconds) || !integer(c.concurrency) ||
    !nonnegative(c.requestsPerSecond) || !integer(batch) || !integer(seed) ||
    !integer(seedRequests) || !integer(setupRequests) || !nonnegative(warmupSeconds) ||
    !nonnegative(cooldownSeconds) || !nonnegative(timeoutSeconds) ||
    !integer(operations) || !positive(maxRequests) || !integer(maxCleanupRequests) ||
    (c.maxRecords !== undefined && !positive(c.maxRecords)) ||
    (c.maxRunSeconds !== undefined && !positive(c.maxRunSeconds)) ||
    !ramps.length || !ramps.every(integer)
  ) throw new Error('finite positive inputs and nonnegative RPS required');

  const rps = c.requestsPerSecond || c.concurrency * 10;
  const requestsPerStage = Math.ceil(c.durationSeconds * rps);
  const measuredRequests = c.smokeOnly ? 0 : requestsPerStage * ramps.length * operations;
  const warmupRequests = c.smokeOnly ? 0 : Math.ceil(warmupSeconds * rps);
  const smokeRequests = 3; // point read, single insert, batch attempt
  const requests = setupRequests + seedRequests + smokeRequests + warmupRequests + measuredRequests;

  const writeRecordsPerCycle = (operations >= 2 ? 1 : 0) + Math.max(0, operations - 2) * batch;
  const records = seed + 1 + batch + (c.smokeOnly ? 0 : requestsPerStage * ramps.length * writeRecordsPerCycle);
  const lifecycleSeconds = (setupRequests + seedRequests + smokeRequests + 1) * timeoutSeconds; // setup, seed, smoke, cleanup
  const estimatedRunSeconds = c.smokeOnly ? lifecycleSeconds :
    (c.durationSeconds + timeoutSeconds) * ramps.length * operations +
    cooldownSeconds * Math.max(0, ramps.length - 1) + warmupSeconds + lifecycleSeconds;

  const violations =
    requests > maxRequests || c.concurrency > 20 || ramps.some(x => x > 20) ||
    (c.maxRunSeconds !== undefined && estimatedRunSeconds > c.maxRunSeconds) ||
    (c.maxRecords !== undefined && records > c.maxRecords);
  if (violations && !c.confirmStress) throw new Error('confirmStress required for explicit stress overrides');

  return { requests, records, estimatedRunSeconds, max: maxRequests };
}
