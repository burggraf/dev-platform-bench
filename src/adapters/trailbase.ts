import {httpAdapter} from './http.js';
export function trailbaseAdapter(base=process.env.TRAILBASE_URL??'') { const c=process.env.TRAILBASE_COLLECTION??'bench_records'; return httpAdapter('trailbase',base,{}, {read:id=>`/api/records/${c}/${id}`,insert:`/api/records/${c}`,batch:`/api/records/${c}`,cleanup:`/api/records/${c}`}); }
