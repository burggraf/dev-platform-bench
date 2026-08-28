import { mkdir, writeFile } from 'node:fs/promises';

const secretKey = /^(?:api_?key|apikey|secret|token|password|authorization|cookie|connection_?string)$/i;
const credentialUrl = /(?:https?|postgres(?:ql)?):\/\/[^\s,;]+/gi;

export function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(credentialUrl, match => {
      try { return new URL(match).host; } catch { return '[redacted-url]'; }
    }).replace(
      /((?:Bearer|Basic)\s+|(?:password|apikey|api[_-]?key|access[_-]?token|authorization|cookie|x-api-key)[=:]\s*)[^\s,;]+/gi,
      '$1[redacted]',
    );
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !secretKey.test(key)).map(([key, item]) => [key, redact(item)]));
  }
  return value;
}

export async function writeReport(result: unknown, dir = 'results') {
  await mkdir(dir, { recursive: true });
  const clean = redact(result) as any;
  await writeFile(`${dir}/result.json`, JSON.stringify(clean, null, 2));
  const rows = (clean.results ?? []).map((item: any) =>
    `| ${item.operation ?? ''} | ${item.targetConcurrency ?? ''} | ${item.recordsPerSecond ?? 0} | ${item.requestsPerSecond ?? 0} | ${item.p95 ?? 0} | ${item.stopReason ?? ''} |`,
  ).join('\n');
  const environment = clean.environment ?? {};
  await writeFile(`${dir}/summary.md`, `# Benchmark result

Provider: ${clean.provider ?? 'unknown'} (${clean.transport ?? 'unknown'})
Endpoint: ${clean.endpoint ?? 'unknown'}
Access path: ${clean.adapterConfig?.accessPath ?? clean.transport ?? 'unknown'}; max connections: ${clean.adapterConfig?.maxConnections ?? 'unknown'}
Region/tier: ${environment.providerRegion ?? 'unknown'} / ${environment.providerTier ?? 'unknown'}
Runner/VPS: ${environment.runnerLocation ?? 'unknown'} / ${environment.vpsSpecs ?? 'unknown'}
Schema: ${environment.schema ?? 'unknown'}
Test date: ${environment.testDate ?? 'unknown'}
Cleanup: ${clean.cleanup?.status ?? 'unknown'}

| Operation | Concurrency | Records/s | Requests/s | P95 ms | Stop |
|---|---:|---:|---:|---:|---|
${rows}
`);
}
