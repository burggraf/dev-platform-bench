import {httpAdapter} from './http.js';
export function pocketbaseAdapter(base=process.env.POCKETBASE_URL??'') { const c=process.env.POCKETBASE_COLLECTION??'bench_records'; return httpAdapter('pocketbase',base,{}, {read:id=>`/api/collections/${c}/records/${id}`,insert:`/api/collections/${c}/records`,batch:`/api/collections/${c}/records`,cleanup:`/api/collections/${c}/records`}); }
