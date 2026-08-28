import {httpAdapter} from './http.js';
import {postgresAdapter} from './postgres.js';
import type {Adapter} from '../types.js';
export function neonApiAdapter(base=process.env.NEON_DATA_API_URL??''){return httpAdapter('neon',base,{'Authorization':`Bearer ${process.env.NEON_API_KEY??''}`},{read:id=>`/records/${id}`,insert:'/records',batch:'/records/batch',cleanup:'/records'});}
export function neonDirectAdapter(query:Parameters<typeof postgresAdapter>[0]):Adapter{return postgresAdapter(query,'bench_records','neon-direct');}
