export function percentile(values:number[], p:number):number { if (!values.length) return 0; const sorted=[...values].sort((a,b)=>a-b); return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)]; }
export function rates(x:{requests:number;records:number;seconds:number}) { return {requestsPerSecond:x.seconds?x.requests/x.seconds:0, recordsPerSecond:x.seconds?x.records/x.seconds:0}; }
