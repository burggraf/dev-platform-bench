export type LogicalRecord = { id: string; runId: string; sequence: number; createdAt: string; payload: string };
export type Operation = 'read' | 'single-write' | 'batch-write';
export type Transport = 'api' | 'direct';

export class NotSupportedError extends Error {
  constructor(message: string) {
    super(`not-supported: ${message}`);
    this.name = 'NotSupportedError';
  }
}

export type RunBudget = {
  requestsRemaining: number;
  recordsRemaining: number;
};

export type Adapter = {
  name: string;
  transport: Transport;
  endpoint?: string;
  metadata?: Record<string, unknown>;
  setupRequestCost?: number;
  seedRequestCost?: (recordCount: number) => number;
  setup(signal?: AbortSignal): Promise<void>;
  seed(records: LogicalRecord[], signal?: AbortSignal): Promise<void>;
  read(id: string, signal?: AbortSignal): Promise<void>;
  insert(record: LogicalRecord, signal?: AbortSignal): Promise<void>;
  batch(records: LogicalRecord[], signal?: AbortSignal): Promise<void>;
  cleanup(runId: string, signal?: AbortSignal, maxRequests?: number): Promise<void>;
};
