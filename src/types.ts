export type LogicalRecord={id:string;runId:string;sequence:number;createdAt:string;payload:string};
export type Operation='read'|'single-write'|'batch-write';
export type Transport='api'|'direct';
export type Adapter={name:string; transport:Transport; setup():Promise<void>; seed(records:LogicalRecord[]):Promise<void>; read(id:string):Promise<void>; insert(record:LogicalRecord):Promise<void>; batch(records:LogicalRecord[]):Promise<void>; cleanup(runId:string):Promise<void>;};
