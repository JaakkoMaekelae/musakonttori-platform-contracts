import type { EventsPage, HqHealth, HqManifest } from "./product";
export declare const manifestFixture: HqManifest;
export declare const eventsPageFixture: EventsPage;
export declare const healthFixture: HqHealth;
export declare const errorEventFixture: {
    eventId: string;
    service: string;
    environment: string;
    timestamp: string;
    errorType: string;
    message: string;
    severity: string;
    operation: string;
    category: string;
};
export declare const CUSTOMER_FIXTURE: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};
export declare const ORDER_FIXTURE: Record<string, unknown>;
