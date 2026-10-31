import {
  hqEventSchema,
  type HqEvent,
  type HqEventName,
} from "../index";

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

export function createHqEvent(input: EmitHqEventInput): HqEvent {
  const occurredAt = input.occurredAt ?? new Date();
  const iso =
    occurredAt instanceof Date ? occurredAt.toISOString() : occurredAt;
  const event = {
    id: input.id ?? crypto.randomUUID(),
    event: input.event,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    idempotencyKey:
      input.idempotencyKey ?? `${input.event}:${input.aggregateId}:${iso}`,
    occurredAt: iso,
    payload: input.payload,
  };

  return hqEventSchema.parse(event);
}

/** Append a canonical HQ event to the product's own outbox. */
export async function emitHqEvent(
  store: HqOutboxStore,
  input: EmitHqEventInput
): Promise<HqEvent> {
  const event = createHqEvent(input);
  await store.insert({ eventId: event.id, event, createdAt: new Date() });
  return event;
}
