import { z } from "zod";
export declare const EVENT_NAMES: readonly ["customer.created", "customer.updated", "contact.created", "support.thread.created", "support.message.created", "order.created", "order.updated", "order.paid", "order.failed", "order.refunded", "payment.created", "payment.paid", "payment.failed", "payment.refunded", "error.created", "error.resolved", "feature_request.created"];
export type HqEventName = (typeof EVENT_NAMES)[number];
export declare const hqEventNameSchema: z.ZodEnum<{
    "contact.created": "contact.created";
    "customer.created": "customer.created";
    "customer.updated": "customer.updated";
    "error.created": "error.created";
    "error.resolved": "error.resolved";
    "feature_request.created": "feature_request.created";
    "order.created": "order.created";
    "order.failed": "order.failed";
    "order.paid": "order.paid";
    "order.refunded": "order.refunded";
    "order.updated": "order.updated";
    "payment.created": "payment.created";
    "payment.failed": "payment.failed";
    "payment.paid": "payment.paid";
    "payment.refunded": "payment.refunded";
    "support.message.created": "support.message.created";
    "support.thread.created": "support.thread.created";
}>;
export declare const CAPABILITIES: readonly ["events", "health", "lookup", "admin_features", "support_context"];
export type HqCapability = (typeof CAPABILITIES)[number];
export declare const hqCapabilitySchema: z.ZodEnum<{
    admin_features: "admin_features";
    events: "events";
    health: "health";
    lookup: "lookup";
    support_context: "support_context";
}>;
export declare const HQ_ENVIRONMENTS: readonly ["production", "preview", "development", "test"];
export type HqEnvironment = (typeof HQ_ENVIRONMENTS)[number];
export declare const hqEnvironmentSchema: z.ZodEnum<{
    development: "development";
    preview: "preview";
    production: "production";
    test: "test";
}>;
export declare const endpointSchema: z.ZodString;
export declare const customerDtoSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    company: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    language: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    segment: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strict>;
export declare const orderDtoSchema: z.ZodObject<{
    id: z.ZodString;
    orderNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customerEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderType: z.ZodString;
    status: z.ZodString;
    paymentStatus: z.ZodString;
    amountCents: z.ZodNumber;
    currency: z.ZodString;
    provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    paidAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    refundedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cancelledAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strict>;
export declare const paymentDtoSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amountCents: z.ZodNumber;
    currency: z.ZodString;
    status: z.ZodString;
    provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    paidAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    failedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    failureReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, z.core.$strict>;
export type CustomerDto = z.infer<typeof customerDtoSchema>;
export type OrderDto = z.infer<typeof orderDtoSchema>;
export type PaymentDto = z.infer<typeof paymentDtoSchema>;
export declare const hqEventSchema: z.ZodObject<{
    id: z.ZodString;
    event: z.ZodEnum<{
        "contact.created": "contact.created";
        "customer.created": "customer.created";
        "customer.updated": "customer.updated";
        "error.created": "error.created";
        "error.resolved": "error.resolved";
        "feature_request.created": "feature_request.created";
        "order.created": "order.created";
        "order.failed": "order.failed";
        "order.paid": "order.paid";
        "order.refunded": "order.refunded";
        "order.updated": "order.updated";
        "payment.created": "payment.created";
        "payment.failed": "payment.failed";
        "payment.paid": "payment.paid";
        "payment.refunded": "payment.refunded";
        "support.message.created": "support.message.created";
        "support.thread.created": "support.thread.created";
    }>;
    aggregateType: z.ZodString;
    aggregateId: z.ZodString;
    idempotencyKey: z.ZodString;
    occurredAt: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strict>;
export type HqEvent = z.infer<typeof hqEventSchema>;
export declare const eventsPageSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        event: z.ZodEnum<{
            "contact.created": "contact.created";
            "customer.created": "customer.created";
            "customer.updated": "customer.updated";
            "error.created": "error.created";
            "error.resolved": "error.resolved";
            "feature_request.created": "feature_request.created";
            "order.created": "order.created";
            "order.failed": "order.failed";
            "order.paid": "order.paid";
            "order.refunded": "order.refunded";
            "order.updated": "order.updated";
            "payment.created": "payment.created";
            "payment.failed": "payment.failed";
            "payment.paid": "payment.paid";
            "payment.refunded": "payment.refunded";
            "support.message.created": "support.message.created";
            "support.thread.created": "support.thread.created";
        }>;
        aggregateType: z.ZodString;
        aggregateId: z.ZodString;
        idempotencyKey: z.ZodString;
        occurredAt: z.ZodString;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strict>>;
    pagination: z.ZodObject<{
        nextCursor: z.ZodNullable<z.ZodString>;
        hasMore: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type EventsPage = z.infer<typeof eventsPageSchema>;
export declare const manifestEndpointsSchema: z.ZodObject<{
    manifest: z.ZodString;
    events: z.ZodOptional<z.ZodString>;
    health: z.ZodString;
    lookupCustomer: z.ZodOptional<z.ZodString>;
    lookupOrder: z.ZodOptional<z.ZodString>;
    lookupPayment: z.ZodOptional<z.ZodString>;
    adminFeatures: z.ZodOptional<z.ZodString>;
    supportContext: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type HqManifestEndpoints = z.infer<typeof manifestEndpointsSchema>;
export declare const DEFAULT_ENDPOINTS: HqManifestEndpoints;
export declare const hqManifestSchema: z.ZodObject<{
    schemaVersion: z.ZodString;
    product: z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
        environment: z.ZodEnum<{
            development: "development";
            preview: "preview";
            production: "production";
            test: "test";
        }>;
    }, z.core.$strict>;
    capabilities: z.ZodArray<z.ZodEnum<{
        admin_features: "admin_features";
        events: "events";
        health: "health";
        lookup: "lookup";
        support_context: "support_context";
    }>>;
    eventTypes: z.ZodArray<z.ZodEnum<{
        "contact.created": "contact.created";
        "customer.created": "customer.created";
        "customer.updated": "customer.updated";
        "error.created": "error.created";
        "error.resolved": "error.resolved";
        "feature_request.created": "feature_request.created";
        "order.created": "order.created";
        "order.failed": "order.failed";
        "order.paid": "order.paid";
        "order.refunded": "order.refunded";
        "order.updated": "order.updated";
        "payment.created": "payment.created";
        "payment.failed": "payment.failed";
        "payment.paid": "payment.paid";
        "payment.refunded": "payment.refunded";
        "support.message.created": "support.message.created";
        "support.thread.created": "support.thread.created";
    }>>;
    endpoints: z.ZodObject<{
        manifest: z.ZodString;
        events: z.ZodOptional<z.ZodString>;
        health: z.ZodString;
        lookupCustomer: z.ZodOptional<z.ZodString>;
        lookupOrder: z.ZodOptional<z.ZodString>;
        lookupPayment: z.ZodOptional<z.ZodString>;
        adminFeatures: z.ZodOptional<z.ZodString>;
        supportContext: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    limits: z.ZodObject<{
        defaultLimit: z.ZodNumber;
        maxLimit: z.ZodNumber;
    }, z.core.$strict>;
    cursorType: z.ZodLiteral<"timestamp_id">;
}, z.core.$strict>;
export type HqManifest = z.infer<typeof hqManifestSchema>;
export declare const HEALTH_STATUSES: readonly ["healthy", "degraded", "down"];
export type HqHealthStatus = (typeof HEALTH_STATUSES)[number];
export declare const CHECK_STATUSES: readonly ["ok", "degraded", "error", "not_configured"];
export type HqCheckStatus = (typeof CHECK_STATUSES)[number];
export declare const hqHealthSchema: z.ZodObject<{
    status: z.ZodEnum<{
        degraded: "degraded";
        down: "down";
        healthy: "healthy";
    }>;
    product: z.ZodString;
    version: z.ZodString;
    environment: z.ZodEnum<{
        development: "development";
        preview: "preview";
        production: "production";
        test: "test";
    }>;
    checks: z.ZodRecord<z.ZodString, z.ZodEnum<{
        degraded: "degraded";
        error: "error";
        not_configured: "not_configured";
        ok: "ok";
    }>>;
    timestamp: z.ZodString;
}, z.core.$strict>;
export type HqHealth = z.infer<typeof hqHealthSchema>;
/** Derive the public health status from individual checks. */
export declare function deriveHealthStatus(checks: Record<string, HqCheckStatus>): HqHealthStatus;
export declare const adminFeatureRouteSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    path: z.ZodString;
    method: z.ZodOptional<z.ZodString>;
}, z.core.$strict>]>;
export declare const adminFeatureSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    riskLevel: z.ZodOptional<z.ZodString>;
    routes: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        path: z.ZodString;
        method: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>]>>>;
    apiRoutes: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        path: z.ZodString;
        method: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>]>>>;
    actions: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const adminFeaturesManifestSchema: z.ZodObject<{
    schemaVersion: z.ZodOptional<z.ZodString>;
    product: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        environment: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    adminBasePath: z.ZodOptional<z.ZodString>;
    exportedAt: z.ZodOptional<z.ZodString>;
    features: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        riskLevel: z.ZodOptional<z.ZodString>;
        routes: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            path: z.ZodString;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>]>>>;
        apiRoutes: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            path: z.ZodString;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>]>>>;
        actions: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString>>;
    unmappedRoutes: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strict>;
export type AdminFeaturesManifest = z.infer<typeof adminFeaturesManifestSchema>;
export declare const supportContextInputSchema: z.ZodObject<{
    category: z.ZodString;
    context: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    customerEmail: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const supportContextSchema: z.ZodObject<{
    facts: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    sources: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type SupportContext = z.infer<typeof supportContextSchema>;
export type SupportContextInput = z.infer<typeof supportContextInputSchema>;
export declare const lookupResponseSchema: z.ZodObject<{
    data: z.ZodUnknown;
}, z.core.$strict>;
export declare const hqErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type HqErrorResponse = z.infer<typeof hqErrorResponseSchema>;
export declare function parseEndpoint(endpoint: string): {
    method: string;
    path: string;
};
