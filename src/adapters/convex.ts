import {httpAdapter} from './http.js';
export function convexAdapter(base=process.env.CONVEX_SITE_URL??''){return httpAdapter('convex',base,{}, {read:id=>'/read',insert:'/insert',batch:'/batch',cleanup:'/cleanup'});}
