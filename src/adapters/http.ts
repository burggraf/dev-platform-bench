import type { Adapter, LogicalRecord } from '../types.js';
import { NotSupportedError } from '../types.js';

type Request = (path: string, method?: string, body?: unknown, signal?: AbortSignal) => Promise<any>;
type Spec = {
  read: (id: string) => string;
  insert: string;
  batch?: string;
  cleanup: (runId: string) => string;
  cleanupRequest?: (runId: string, request: Request, signal?: AbortSignal) => Promise<void>;
  setup?: (signal?: AbortSignal) => Promise<void>;
  encode?: (record: LogicalRecord) => unknown;
  encodeBatch?: (records: LogicalRecord[]) => unknown;
};

export function httpAdapter(
  name: string,
  base: string,
  headers: Record<string, string>,
  spec: Spec,
  timeoutMs = 10_000,
): Adapter {
  const request: Request = async (path, method = 'GET', body, external) => {
    if (!base) throw new Error(`${name}: missing endpoint`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    external?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        method,
        headers: { accept: 'application/json', 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${name} ${response.status}: ${text.slice(0, 100).replace(/https?:\/\/[^ ]+/g, '[redacted]')}`);
      try { return text ? JSON.parse(text) : undefined; } catch { return undefined; }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error(`${name} timeout`);
      throw error;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', abort);
    }
  };

  const unsupported = (operation: string) => Promise.reject(new NotSupportedError(`${name} ${operation}`));
  const encode = spec.encode ?? ((record: LogicalRecord) => record);
  return {
    name,
    transport: 'api',
    endpoint: base,
    seedRequestCost: count => spec.batch ? 1 : count,
    setup: signal => spec.setup?.(signal) ?? Promise.resolve(),
    seed: async (rows, signal) => {
      if (spec.batch) await request(spec.batch, 'POST', spec.encodeBatch?.(rows) ?? rows, signal);
      else for (const row of rows) await request(spec.insert, 'POST', encode(row), signal);
    },
    read: (id, signal) => request(spec.read(id), 'GET', undefined, signal).then(result => {
      if (result === undefined || result === null || (Array.isArray(result) && !result.length)
        || (result && Array.isArray(result.data) && !result.data.length)) throw new Error(`${name} read: record not found`);
    }),
    insert: (row, signal) => request(spec.insert, 'POST', encode(row), signal),
    batch: spec.batch
      ? (rows, signal) => request(spec.batch!, 'POST', spec.encodeBatch?.(rows) ?? rows, signal)
      : () => unsupported('batch write'),
    cleanup: async (runId, signal, maxRequests = 1000) => {
      if (!Number.isSafeInteger(maxRequests) || maxRequests <= 0) {
        throw new Error(`${name} cleanup request budget must be a finite positive integer`);
      }
      let remaining = maxRequests;
      const limitedRequest: Request = (...args) => {
        if (remaining-- <= 0) return Promise.reject(new Error(`${name} cleanup request budget exhausted`));
        return request(...args);
      };
      if (spec.cleanupRequest) await spec.cleanupRequest(runId, limitedRequest, signal);
      else await limitedRequest(spec.cleanup(runId), 'DELETE', undefined, signal);
    },
  };
}
