import { createHash } from 'node:crypto';
import type { LogicalRecord } from './types.js';
export function record(runId:string, sequence:number, payloadBytes=1024):LogicalRecord { const id=createHash('sha256').update(`${runId}:${sequence}`).digest('hex').slice(0,24); return {id,runId,sequence,createdAt:new Date(0).toISOString(),payload:'x'.repeat(payloadBytes)}; }
export function records(runId:string,count:number,payloadBytes=1024){return Array.from({length:count},(_,i)=>record(runId,i,payloadBytes));}
