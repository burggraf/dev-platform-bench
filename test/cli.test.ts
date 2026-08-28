import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('cleanup-only command skips unrelated workload preflight', () => {
  const result = spawnSync(process.execPath, [
    '--import', 'tsx', 'src/cli.ts',
    '--provider', 'fake',
    '--cleanup-run', '00000000-0000-4000-8000-000000000000',
    '--max-requests', '1',
  ], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /cleanup ok/);
});

test('cleanup-only command rejects invalid cleanup limits', () => {
  for (const [flag, value] of [['--max-cleanup-requests', 'NaN'], ['--max-cleanup-requests', 'Infinity'], ['--timeout-ms', 'NaN']]) {
    const result = spawnSync(process.execPath, [
      '--import', 'tsx', 'src/cli.ts',
      '--provider', 'fake',
      '--cleanup-run', '00000000-0000-4000-8000-000000000000',
      flag, value,
    ], { cwd: process.cwd(), encoding: 'utf8' });
    assert.notEqual(result.status, 0, `${flag}=${value} unexpectedly succeeded`);
    assert.match(result.stderr, /finite positive integer cleanup limits/);
  }
});
