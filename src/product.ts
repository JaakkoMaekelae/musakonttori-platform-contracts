import { z } from "zod";

/**
 * Canonical product<->HQ contract.
 *
 * A product owns its data and its `/internal/hq/*` projection. HQ only reads.
 * These schemas are the single source of truth for the wire format.
 */

const isoDateTime = z
  .string()
  .min(20)
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid ISO-8601 date");

export const EVENT_NAMES = [
  "customer.created",
  "customer.updated",
  "contact.created",
  "support.thread.created",
  "support.message.created",
  "order.created",
  "order.updated",
  "order.paid",
  "order.failed",
  "order.refunded",
  "payment.created",
  "payment.paid",
  "payment.failed",
  "payment.refunded",
  "error.created",
  "error.resolved",
  "feature_request.created",
] as const;

export type HqEventName = (typeof EVENT_NAMES)[number];
export const hqEventNameSchema = z.enum(EVENT_NAMES);

export const CAPABILITIES = [
  "events",
  "health",
  "lookup",
  "admin_features",
  "support_context",
] as const;
export type HqCapability = (typeof CAPABILITIES)[number];
export const hqCapabilitySchema = z.enum(CAPABILITIES);

export const HQ_ENVIRONMENTS = [
  "production",
  "preview",
  "development",
  "test",
] as const;
export type HqEnvironment = (typeof HQ_ENVIRONMENTS)[number];
export const hqEnvironmentSchema = z.enum(HQ_ENVIRONMENTS);

export const endpointSchema = z
  .string()
  .regex(/^(GET|POST|PUT|PATCH|DELETE) \/\S*$/, "endpoint must be 'METHOD /path'");

export const customerDtoSchema = z
  .object({
    id: z.string().min(1).max(200),
    email: z.string().email().max(320).nullable().optional(),
    name: z.string().max(200).nullable().optional(),
    company: z.string().max(200).nullable().optional(),
    phone: z.string().max(60).nullable().optional(),
    country: z.string().max(10).nullable().optional(),
    language: z.string().max(20).nullable().optional(),
    segment: z.string().max(60).nullable().optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

export const orderDtoSchema = z
  .object({
    id: z.string().min(1).max(200),
    orderNumber: z.string().max(120).nullable().optional(),
    customerId: z.string().max(200).nullable().optional(),
    customerEmail: z.string().email().max(320).nullable().optional(),
    orderType: z.string().min(1).max(60),
    status: z.string().min(1).max(60),
    paymentStatus: z.string().min(1).max(60),
    amountCents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    provider: z.string().max(60).nullable().optional(),
    paidAt: isoDateTime.nullable().optional(),
    refundedAt: isoDateTime.nullable().optional(),
    cancelledAt: isoDateTime.nullable().optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

export const paymentDtoSchema = z
  .object({
    id: z.string().min(1).max(200),
    orderId: z.string().max(200).nullable().optional(),
    customerId: z.string().max(200).nullable().optional(),
    amountCents: z.number().int(),
    currency: z.string().length(3),
    status: z.string().min(1).max(60),
    provider: z.string().max(60).nullable().optional(),
    paidAt: isoDateTime.nullable().optional(),
    failedAt: isoDateTime.nullable().optional(),
    failureReason: z.string().max(1000).nullable().optional(),
    createdAt: isoDateTime,
  })
  .strict();

export type CustomerDto = z.infer<typeof customerDtoSchema>;
export type OrderDto = z.infer<typeof orderDtoSchema>;
export type PaymentDto = z.infer<typeof paymentDtoSchema>;

export const hqEventSchema = z
  .object({
    id: z.string().min(1).max(200),
    event: hqEventNameSchema,
    aggregateType: z.string().min(1).max(100),
    aggregateId: z.string().min(1).max(200),
    idempotencyKey: z.string().min(1).max(300),
    occurredAt: isoDateTime,
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();

export type HqEvent = z.infer<typeof hqEventSchema>;

export const eventsPageSchema = z
  .object({
    data: z.array(hqEventSchema),
    pagination: z
      .object({
        nextCursor: z.string().max(400).nullable(),
        hasMore: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type EventsPage = z.infer<typeof eventsPageSchema>;

export const manifestEndpointsSchema = z
  .object({
    manifest: endpointSchema,
    events: endpointSchema.optional(),
    health: endpointSchema,
    lookupCustomer: endpointSchema.optional(),
    lookupOrder: endpointSchema.optional(),
    lookupPayment: endpointSchema.optional(),
    adminFeatures: endpointSchema.optional(),
    supportContext: endpointSchema.optional(),
  })
  .strict();

export type HqManifestEndpoints = z.infer<typeof manifestEndpointsSchema>;

export const DEFAULT_ENDPOINTS: HqManifestEndpoints = {
  manifest: "GET /internal/hq/manifest",
  events: "GET /internal/hq/events",
  health: "GET /internal/hq/health",
  lookupCustomer: "GET /internal/hq/customers/:id",
  lookupOrder: "GET /internal/hq/orders/:id",
  lookupPayment: "GET /internal/hq/payments/:id",
  adminFeatures: "GET /internal/hq/admin-features",
  supportContext: "POST /internal/hq/support-context",
};

export const hqManifestSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/, "semver required"),
    product: z
      .object({
        name: z.string().min(1).max(120),
        slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase slug"),
        environment: hqEnvironmentSchema,
      })
      .strict(),
    capabilities: z.array(hqCapabilitySchema),
    eventTypes: z.array(hqEventNameSchema),
    endpoints: manifestEndpointsSchema,
    limits: z
      .object({
        defaultLimit: z.number().int().min(1).max(1000),
        maxLimit: z.number().int().min(1).max(1000),
      })
      .strict(),
    cursorType: z.literal("timestamp_id"),
  })
  .strict();

export type HqManifest = z.infer<typeof hqManifestSchema>;

export const HEALTH_STATUSES = ["healthy", "degraded", "down"] as const;
export type HqHealthStatus = (typeof HEALTH_STATUSES)[number];
export const CHECK_STATUSES = ["ok", "degraded", "error", "not_configured"] as const;
export type HqCheckStatus = (typeof CHECK_STATUSES)[number];

export const hqHealthSchema = z
  .object({
    status: z.enum(HEALTH_STATUSES),
    product: z.string().min(1).max(120),
    version: z.string().min(1).max(60),
    environment: hqEnvironmentSchema,
    checks: z.record(z.string(), z.enum(CHECK_STATUSES)),
    timestamp: isoDateTime,
  })
  .strict();

export type HqHealth = z.infer<typeof hqHealthSchema>;

/** Derive the public health status from individual checks. */
export function deriveHealthStatus(
  checks: Record<string, HqCheckStatus>
): HqHealthStatus {
  const values = Object.values(checks);
  if (values.some((status) => status === "error")) return "down";
  if (values.some((status) => status === "degraded")) return "degraded";
  return "healthy";
}

export const adminFeatureRouteSchema = z.union([
  z.string(),
  z.object({ path: z.string(), method: z.string().optional() }).strict(),
]);

export const adminFeatureSchema = z
  .object({
    key: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    riskLevel: z.string().optional(),
    routes: z.array(adminFeatureRouteSchema).optional(),
    apiRoutes: z.array(adminFeatureRouteSchema).optional(),
    actions: z.array(z.string()),
  })
  .strict();

export const adminFeaturesManifestSchema = z
  .object({
    schemaVersion: z.string().optional(),
    product: z
      .object({
        name: z.string().optional(),
        slug: z.string().min(1),
        environment: z.string().optional(),
      })
      .strict(),
    adminBasePath: z.string().optional(),
    exportedAt: z.string().optional(),
    features: z.array(adminFeatureSchema).min(1),
    warnings: z.array(z.string()).optional(),
    unmappedRoutes: z.unknown().optional(),
  })
  .strict();

export type AdminFeaturesManifest = z.infer<typeof adminFeaturesManifestSchema>;

export const supportContextInputSchema = z
  .object({
    category: z.string().min(1).max(120),
    context: z.record(z.string(), z.string()).default({}),
    customerEmail: z.string().email().max(320).optional(),
  })
  .strict();

export const supportContextSchema = z
  .object({
    facts: z.record(z.string(), z.unknown()),
    sources: z.array(z.string()),
  })
  .strict();

export type SupportContext = z.infer<typeof supportContextSchema>;
export type SupportContextInput = z.infer<typeof supportContextInputSchema>;

export const lookupResponseSchema = z.object({ data: z.unknown() }).strict();

export const hqErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

export type HqErrorResponse = z.infer<typeof hqErrorResponseSchema>;

export function parseEndpoint(endpoint: string): { method: string; path: string } {
  const [method, path] = endpoint.split(" ");
  if (!method || !path) throw new Error(`Invalid endpoint: ${endpoint}`);
  return { method, path };
}
