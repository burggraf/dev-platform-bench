import { mutation, query } from './_generated/server'; import { v } from 'convex/values';
const rec=v.object({benchId:v.string(),runId:v.string(),sequence:v.number(),createdAt:v.string(),payload:v.string()});
export const read=query({args:{id:v.string()},handler:async(ctx,args)=>{const row=await ctx.db.query('benchRecords').withIndex('by_benchId',q=>q.eq('benchId',args.id)).unique();if(!row)throw new Error('record not found');return row;}});
export const insert=mutation({args:{record:rec},handler:async(ctx,args)=>ctx.db.insert('benchRecords',args.record)});
export const batch=mutation({args:{records:v.array(rec)},handler:async(ctx,args)=>{for(const row of args.records)await ctx.db.insert('benchRecords',row);}});
export const cleanup=mutation({args:{runId:v.string()},handler:async(ctx,args)=>{const rows=await ctx.db.query('benchRecords').withIndex('by_runId',q=>q.eq('runId',args.runId)).collect();for(const row of rows)await ctx.db.delete(row._id);return rows.length;}});
