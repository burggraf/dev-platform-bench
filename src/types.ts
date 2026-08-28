export type LogicalRecord={id:string;runId:string;sequence:number;createdAt:string;payload:string};
export type Operation='read'|'single-write'|'batch-write'; export type Transport='api'|'direct';
export class NotSupportedError extends Error { constructor(message:string){super(`not-supported: ${message}`);this.name='NotSupportedError';} }
export type Adapter={name:string;transport:Transport;endpoint?:string;setup():Promise<void>;seed(records:LogicalRecord[]):Promise<void>;read(id:string):Promise<void>;insert(record:LogicalRecord):Promise<void>;batch(records:LogicalRecord[]):Promise<void>;cleanup(runId:string):Promise<void>;};
