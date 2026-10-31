import { type HqEvent, type HqEventName } from "../index";
export interface HqOutboxRecord {
    eventId: string;
    event: HqEvent;
    createdAt: Date;
}
export interface HqOutboxStore {
    insert(record: HqOutboxRecord): Promise<void>;
}
export interface EmitHqEventInput {
    event: HqEventName;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    occurredAt?: Date | string;
    id?: string;
    idempotencyKey?: string;
}
export declare function createHqEvent(input: EmitHqEventInput): HqEvent;
/** Append a canonical HQ event to the product's own outbox. */
export declare function emitHqEvent(store: HqOutboxStore, input: EmitHqEventInput): Promise<HqEvent>;
