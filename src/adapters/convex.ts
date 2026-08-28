import {httpAdapter} from './http.js'; import type {LogicalRecord} from '../types.js';
/** HTTP actions must be deployed by the user; paths are configurable to match the deployed action names. */
export function convexAdapter(base=process.env.CONVEX_SITE_URL??''){const p=(key:string, fallback:string)=>process.env[`CONVEX_${key}`]??fallback; return httpAdapter('convex',base,{}, {read:()=>p('READ_PATH','/read'),insert:p('INSERT_PATH','/insert'),batch:p('BATCH_PATH','/batch'),cleanup:()=>p('CLEANUP_PATH','/cleanup'),encode:(r:LogicalRecord)=>r,encodeBatch:(rs)=>({records:rs})});}
