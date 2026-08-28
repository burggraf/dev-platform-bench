import {httpAdapter} from './http.js';
import {postgresAdapter} from './postgres.js';
import type {Adapter} from '../types.js';
export function supabaseApiAdapter(base=process.env.SUPABASE_URL??''){const key=process.env.SUPABASE_ANON_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY??''; return httpAdapter('supabase',`${base}/rest/v1`,{apikey:key,Authorization:`Bearer ${key}`},{read:id=>`/bench_records?id=eq.${encodeURIComponent(id)}`,insert:'/bench_records',batch:'/bench_records',cleanup:'/bench_records'});}
export function supabaseDirectAdapter(query:Parameters<typeof postgresAdapter>[0]):Adapter{return postgresAdapter(query,'bench_records','supabase-direct');}
