"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/product.ts
var product_exports = {};
__export(product_exports, {
  CAPABILITIES: () => CAPABILITIES,
  CHECK_STATUSES: () => CHECK_STATUSES,
  DEFAULT_ENDPOINTS: () => DEFAULT_ENDPOINTS,
  EVENT_NAMES: () => EVENT_NAMES,
  HEALTH_STATUSES: () => HEALTH_STATUSES,
  HQ_ENVIRONMENTS: () => HQ_ENVIRONMENTS,
  adminFeatureRouteSchema: () => adminFeatureRouteSchema,
  adminFeatureSchema: () => adminFeatureSchema,
  adminFeaturesManifestSchema: () => adminFeaturesManifestSchema,
  customerDtoSchema: () => customerDtoSchema,
  deriveHealthStatus: () => deriveHealthStatus,
  endpointSchema: () => endpointSchema,
  eventsPageSchema: () => eventsPageSchema,
  hqCapabilitySchema: () => hqCapabilitySchema,
  hqEnvironmentSchema: () => hqEnvironmentSchema,
  hqErrorResponseSchema: () => hqErrorResponseSchema,
  hqEventNameSchema: () => hqEventNameSchema,
  hqEventSchema: () => hqEventSchema,
  hqHealthSchema: () => hqHealthSchema,
  hqManifestSchema: () => hqManifestSchema,
  lookupResponseSchema: () => lookupResponseSchema,
  manifestEndpointsSchema: () => manifestEndpointsSchema,
  orderDtoSchema: () => orderDtoSchema,
  parseEndpoint: () => parseEndpoint,
  paymentDtoSchema: () => paymentDtoSchema,
  supportContextInputSchema: () => supportContextInputSchema,
  supportContextSchema: () => supportContextSchema
});
module.exports = __toCommonJS(product_exports);
var import_zod = require("zod");
var isoDateTime = import_zod.z.string().min(20).max(40).refine((value) => !Number.isNaN(Date.parse(value)), "invalid ISO-8601 date");
var EVENT_NAMES = [
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
  "feature_request.created"
];
var hqEventNameSchema = import_zod.z.enum(EVENT_NAMES);
var CAPABILITIES = [
  "events",
  "health",
  "lookup",
  "admin_features",
  "support_context"
];
var hqCapabilitySchema = import_zod.z.enum(CAPABILITIES);
var HQ_ENVIRONMENTS = [
  "production",
  "preview",
  "development",
  "test"
];
var hqEnvironmentSchema = import_zod.z.enum(HQ_ENVIRONMENTS);
var endpointSchema = import_zod.z.string().regex(/^(GET|POST|PUT|PATCH|DELETE) \/\S*$/, "endpoint must be 'METHOD /path'");
var customerDtoSchema = import_zod.z.object({
  id: import_zod.z.string().min(1).max(200),
  email: import_zod.z.string().email().max(320).nullable().optional(),
  name: import_zod.z.string().max(200).nullable().optional(),
  company: import_zod.z.string().max(200).nullable().optional(),
  phone: import_zod.z.string().max(60).nullable().optional(),
  country: import_zod.z.string().max(10).nullable().optional(),
  language: import_zod.z.string().max(20).nullable().optional(),
  segment: import_zod.z.string().max(60).nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
}).strict();
var orderDtoSchema = import_zod.z.object({
  id: import_zod.z.string().min(1).max(200),
  orderNumber: import_zod.z.string().max(120).nullable().optional(),
  customerId: import_zod.z.string().max(200).nullable().optional(),
  customerEmail: import_zod.z.string().email().max(320).nullable().optional(),
  orderType: import_zod.z.string().min(1).max(60),
  status: import_zod.z.string().min(1).max(60),
  paymentStatus: import_zod.z.string().min(1).max(60),
  amountCents: import_zod.z.number().int().nonnegative(),
  currency: import_zod.z.string().length(3),
  provider: import_zod.z.string().max(60).nullable().optional(),
  paidAt: isoDateTime.nullable().optional(),
  refundedAt: isoDateTime.nullable().optional(),
  cancelledAt: isoDateTime.nullable().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
}).strict();
var paymentDtoSchema = import_zod.z.object({
  id: import_zod.z.string().min(1).max(200),
  orderId: import_zod.z.string().max(200).nullable().optional(),
  customerId: import_zod.z.string().max(200).nullable().optional(),
  amountCents: import_zod.z.number().int(),
  currency: import_zod.z.string().length(3),
  status: import_zod.z.string().min(1).max(60),
  provider: import_zod.z.string().max(60).nullable().optional(),
  paidAt: isoDateTime.nullable().optional(),
  failedAt: isoDateTime.nullable().optional(),
  failureReason: import_zod.z.string().max(1e3).nullable().optional(),
  createdAt: isoDateTime
}).strict();
var hqEventSchema = import_zod.z.object({
  id: import_zod.z.string().min(1).max(200),
  event: hqEventNameSchema,
  aggregateType: import_zod.z.string().min(1).max(100),
  aggregateId: import_zod.z.string().min(1).max(200),
  idempotencyKey: import_zod.z.string().min(1).max(300),
  occurredAt: isoDateTime,
  payload: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown())
}).strict();
var eventsPageSchema = import_zod.z.object({
  data: import_zod.z.array(hqEventSchema),
  pagination: import_zod.z.object({
    nextCursor: import_zod.z.string().max(400).nullable(),
    hasMore: import_zod.z.boolean()
  }).strict()
}).strict();
var manifestEndpointsSchema = import_zod.z.object({
  manifest: endpointSchema,
  events: endpointSchema.optional(),
  health: endpointSchema,
  lookupCustomer: endpointSchema.optional(),
  lookupOrder: endpointSchema.optional(),
  lookupPayment: endpointSchema.optional(),
  adminFeatures: endpointSchema.optional(),
  supportContext: endpointSchema.optional()
}).strict();
var DEFAULT_ENDPOINTS = {
  manifest: "GET /internal/hq/manifest",
  events: "GET /internal/hq/events",
  health: "GET /internal/hq/health",
  lookupCustomer: "GET /internal/hq/customers/:id",
  lookupOrder: "GET /internal/hq/orders/:id",
  lookupPayment: "GET /internal/hq/payments/:id",
  adminFeatures: "GET /internal/hq/admin-features",
  supportContext: "POST /internal/hq/support-context"
};
var hqManifestSchema = import_zod.z.object({
  schemaVersion: import_zod.z.string().regex(/^\d+\.\d+\.\d+$/, "semver required"),
  product: import_zod.z.object({
    name: import_zod.z.string().min(1).max(120),
    slug: import_zod.z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase slug"),
    environment: hqEnvironmentSchema
  }).strict(),
  capabilities: import_zod.z.array(hqCapabilitySchema),
  eventTypes: import_zod.z.array(hqEventNameSchema),
  endpoints: manifestEndpointsSchema,
  limits: import_zod.z.object({
    defaultLimit: import_zod.z.number().int().min(1).max(1e3),
    maxLimit: import_zod.z.number().int().min(1).max(1e3)
  }).strict(),
  cursorType: import_zod.z.literal("timestamp_id")
}).strict();
var HEALTH_STATUSES = ["healthy", "degraded", "down"];
var CHECK_STATUSES = ["ok", "degraded", "error", "not_configured"];
var hqHealthSchema = import_zod.z.object({
  status: import_zod.z.enum(HEALTH_STATUSES),
  product: import_zod.z.string().min(1).max(120),
  version: import_zod.z.string().min(1).max(60),
  environment: hqEnvironmentSchema,
  checks: import_zod.z.record(import_zod.z.string(), import_zod.z.enum(CHECK_STATUSES)),
  timestamp: isoDateTime
}).strict();
function deriveHealthStatus(checks) {
  const values = Object.values(checks);
  if (values.some((status) => status === "error")) return "down";
  if (values.some((status) => status === "degraded")) return "degraded";
  return "healthy";
}
var adminFeatureRouteSchema = import_zod.z.union([
  import_zod.z.string(),
  import_zod.z.object({ path: import_zod.z.string(), method: import_zod.z.string().optional() }).strict()
]);
var adminFeatureSchema = import_zod.z.object({
  key: import_zod.z.string().min(1),
  name: import_zod.z.string().min(1),
  description: import_zod.z.string().optional(),
  category: import_zod.z.string().optional(),
  riskLevel: import_zod.z.string().optional(),
  routes: import_zod.z.array(adminFeatureRouteSchema).optional(),
  apiRoutes: import_zod.z.array(adminFeatureRouteSchema).optional(),
  actions: import_zod.z.array(import_zod.z.string())
}).strict();
var adminFeaturesManifestSchema = import_zod.z.object({
  schemaVersion: import_zod.z.string().optional(),
  product: import_zod.z.object({
    name: import_zod.z.string().optional(),
    slug: import_zod.z.string().min(1),
    environment: import_zod.z.string().optional()
  }).strict(),
  adminBasePath: import_zod.z.string().optional(),
  exportedAt: import_zod.z.string().optional(),
  features: import_zod.z.array(adminFeatureSchema).min(1),
  warnings: import_zod.z.array(import_zod.z.string()).optional(),
  unmappedRoutes: import_zod.z.unknown().optional()
}).strict();
var supportContextInputSchema = import_zod.z.object({
  category: import_zod.z.string().min(1).max(120),
  context: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).default({}),
  customerEmail: import_zod.z.string().email().max(320).optional()
}).strict();
var supportContextSchema = import_zod.z.object({
  facts: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()),
  sources: import_zod.z.array(import_zod.z.string())
}).strict();
var lookupResponseSchema = import_zod.z.object({ data: import_zod.z.unknown() }).strict();
var hqErrorResponseSchema = import_zod.z.object({
  error: import_zod.z.object({
    code: import_zod.z.string(),
    message: import_zod.z.string(),
    details: import_zod.z.unknown().optional()
  }).strict()
}).strict();
function parseEndpoint(endpoint) {
  const [method, path] = endpoint.split(" ");
  if (!method || !path) throw new Error(`Invalid endpoint: ${endpoint}`);
  return { method, path };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CAPABILITIES,
  CHECK_STATUSES,
  DEFAULT_ENDPOINTS,
  EVENT_NAMES,
  HEALTH_STATUSES,
  HQ_ENVIRONMENTS,
  adminFeatureRouteSchema,
  adminFeatureSchema,
  adminFeaturesManifestSchema,
  customerDtoSchema,
  deriveHealthStatus,
  endpointSchema,
  eventsPageSchema,
  hqCapabilitySchema,
  hqEnvironmentSchema,
  hqErrorResponseSchema,
  hqEventNameSchema,
  hqEventSchema,
  hqHealthSchema,
  hqManifestSchema,
  lookupResponseSchema,
  manifestEndpointsSchema,
  orderDtoSchema,
  parseEndpoint,
  paymentDtoSchema,
  supportContextInputSchema,
  supportContextSchema
});
//# sourceMappingURL=product.cjs.map