import { httpAdapter } from './http.js';
import type { LogicalRecord } from '../types.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encodedUuid = /^[A-Za-z0-9_-]{22}$/;

export function uuidToTrailbaseId(value: string) {
  if (!uuid.test(value)) throw new Error('TrailBase record ID must be a UUID');
  return Buffer.from(value.replaceAll('-', ''), 'hex').toString('base64url');
}

export function trailbasePathId(value: string) {
  if (uuid.test(value)) return uuidToTrailbaseId(value);
  if (encodedUuid.test(value)) return value;
  throw new Error('TrailBase returned an invalid record ID');
}

export function trailbaseAdapter(base = process.env.TRAILBASE_URL ?? '') {
  const token = process.env.TRAILBASE_BEARER_TOKEN ?? '';
  const collection = process.env.TRAILBASE_API_NAME ?? process.env.TRAILBASE_COLLECTION ?? 'bench_records';
  const path = `/api/records/v1/${encodeURIComponent(collection)}`;
  return httpAdapter('trailbase', base, token ? { authorization: `Bearer ${token}` } : {}, {
    read: id => `${path}/${trailbasePathId(id)}`,
    insert: path,
    setup: async () => {
      if (!base || !token) throw new Error('trailbase: missing TRAILBASE_URL or TRAILBASE_BEARER_TOKEN');
    },
    encode: (record: LogicalRecord) => ({
      id: record.id,
      runId: record.runId,
      sequence: record.sequence,
      createdAt: record.createdAt,
      payload: record.payload,
    }),
    cleanup: () => path,
    cleanupRequest: async (runId, request, signal) => {
      for (;;) {
        const result = await request(`${path}?limit=100&offset=0&filter%5BrunId%5D%5B%24eq%5D=${encodeURIComponent(runId)}`, 'GET', undefined, signal);
        const items = result?.records ?? result?.data ?? [];
        for (const item of items) {
          await request(`${path}/${trailbasePathId(item.id ?? item._id)}`, 'DELETE', undefined, signal);
        }
        if (items.length < 100) break;
      }
    },
  });
}
