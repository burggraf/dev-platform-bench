import test from 'node:test'; import assert from 'node:assert/strict'; import {run} from '../src/runner.js'; import {fakeAdapter} from '../src/adapters/fake.js';
test('runner cleans up after completed lifecycle',async()=>{const a=fakeAdapter(); const result=await run(a,{count:2,durationSeconds:.01,concurrency:1}); assert.equal(result.provider,'fake'); assert.equal(result.results.length,3);});
