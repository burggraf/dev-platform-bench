# Appwrite

Required variables: `APPWRITE_ENDPOINT` (host), `APPWRITE_PROJECT`, `APPWRITE_KEY`, `APPWRITE_DATABASE`, `APPWRITE_COLLECTION`. Create a database/collection and document ID plus `runId`, `sequence`, `createdAt`, `payload`; index `runId` if cleanup queries use it. Appwrite's create-document endpoint is one document per request, so the adapter reports batch as not-supported rather than pretending a client loop is bulk. Cleanup must delete only IDs returned by a run-ID query.

Smoke after setup: `npm run bench -- --provider appwrite --smoke-only`. Do not run a load stage until one read/create/delete is verified. Official docs: [databases](https://appwrite.io/docs/products/databases), [server API](https://appwrite.io/docs/references/cloud/server-nodejs/databases), [rate limits](https://appwrite.io/docs/advanced/platform/rate-limits). Accessed 2026-08-28; current account limits are not hard-coded because they vary by plan.
