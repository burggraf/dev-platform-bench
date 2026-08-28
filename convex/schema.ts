import { defineSchema, defineTable } from 'convex/server'; import { v } from 'convex/values';
export default defineSchema({ benchRecords: defineTable({ benchId:v.string(), runId:v.string(), sequence:v.number(), createdAt:v.string(), payload:v.string() }).index('by_benchId',['benchId']).index('by_runId',['runId']) });
