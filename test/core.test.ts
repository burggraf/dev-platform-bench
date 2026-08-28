import test from 'node:test';
import assert from 'node:assert/strict';
import { percentile, rates } from '../src/metrics.js';
import { record, records } from '../src/records.js';
import { preflight } from '../src/safety.js';

test('percentiles use nearest rank and empty samples are zero', () => { assert.equal(percentile([], .95), 0); assert.equal(percentile([3,1,2,10], .5), 2); assert.equal(percentile([1,2,3,4], .95), 4); });
test('rates count requests and records', () => { assert.deepEqual(rates({requests:10, records:30, seconds:2}), {requestsPerSecond:5, recordsPerSecond:15}); });
test('records are deterministic and unique per run', () => { const a=record('run', 1, 16); const b=record('run', 1, 16); assert.deepEqual(a,b); assert.equal(records('run', 2, 4)[1].sequence,1); assert.notEqual(records('a',1,1)[0].id,records('b',1,1)[0].id); });
test('preflight rejects stress without confirmation', () => { assert.throws(()=>preflight({durationSeconds:60, concurrency:100, requestsPerSecond:1000, confirmStress:false}), /confirmStress/); });
