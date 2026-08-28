export type SafetyConfig={durationSeconds:number;concurrency:number;requestsPerSecond:number;confirmStress?:boolean;maxRequests?:number};
const DEFAULT_MAX=10000;
export function preflight(c:SafetyConfig){ const requests=Math.ceil(c.durationSeconds*c.requestsPerSecond); const max=c.maxRequests??DEFAULT_MAX; if ((requests>max||c.concurrency>20||c.requestsPerSecond>100)&&!c.confirmStress) throw new Error('confirmStress required for explicit stress overrides'); return {requests,max}; }
