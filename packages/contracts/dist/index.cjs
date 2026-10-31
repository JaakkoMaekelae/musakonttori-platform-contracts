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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CAPABILITIES: () => CAPABILITIES,
  CHECK_STATUSES: () => CHECK_STATUSES,
  CUSTOMER_FIXTURE: () => CUSTOMER_FIXTURE,
  DEFAULT_ENDPOINTS: () => DEFAULT_ENDPOINTS,
  EVENT_NAMES: () => EVENT_NAMES,
  HEALTH_STATUSES: () => HEALTH_STATUSES,
  HQ_AUTH_HEADERS: () => HQ_AUTH_HEADERS,
  HQ_AUTH_MAX_SKEW_MS: () => HQ_AUTH_MAX_SKEW_MS,
  HQ_AUTH_NONCE_TTL_MS: () => HQ_AUTH_NONCE_TTL_MS,
  HQ_AUTH_VERSION: () => HQ_AUTH_VERSION,
  HQ_ENVIRONMENTS: () => HQ_ENVIRONMENTS,
  ORDER_FIXTURE: () => ORDER_FIXTURE,
  adminFeatureRouteSchema: () => adminFeatureRouteSchema,
  adminFeatureSchema: () => adminFeatureSchema,
  adminFeaturesManifestSchema: () => adminFeaturesManifestSchema,
  authFailureBody: () => authFailureBody,
  buildCanonicalString: () => buildCanonicalString,
  collector: () => collector_exports,
  createMemoryNonceStore: () => createMemoryNonceStore,
  customerDtoSchema: () => customerDtoSchema,
  deriveHealthStatus: () => deriveHealthStatus,
  endpointSchema: () => endpointSchema,
  errorEventFixture: () => errorEventFixture,
  eventsPageFixture: () => eventsPageFixture,
  eventsPageSchema: () => eventsPageSchema,
  healthFixture: () => healthFixture,
  hmacHex: () => hmacHex,
  hqCapabilitySchema: () => hqCapabilitySchema,
  hqEnvironmentSchema: () => hqEnvironmentSchema,
  hqErrorResponseSchema: () => hqErrorResponseSchema,
  hqEventNameSchema: () => hqEventNameSchema,
  hqEventSchema: () => hqEventSchema,
  hqHealthSchema: () => hqHealthSchema,
  hqManifestSchema: () => hqManifestSchema,
  lookupResponseSchema: () => lookupResponseSchema,
  manifestEndpointsSchema: () => manifestEndpointsSchema,
  manifestFixture: () => manifestFixture,
  orderDtoSchema: () => orderDtoSchema,
  parseEndpoint: () => parseEndpoint,
  paymentDtoSchema: () => paymentDtoSchema,
  sha256Hex: () => sha256Hex,
  signHqRequest: () => signHqRequest,
  supportContextInputSchema: () => supportContextInputSchema,
  supportContextSchema: () => supportContextSchema,
  verifyHqRequest: () => verifyHqRequest
});
module.exports = __toCommonJS(src_exports);

// src/auth.ts
var import_node_crypto = require("crypto");
var HQ_AUTH_HEADERS = {
  clientId: "x-hq-client-id",
  timestamp: "x-hq-timestamp",
  nonce: "x-hq-nonce",
  signature: "x-hq-signature",
  version: "x-hq-version"
};
var HQ_AUTH_VERSION = "1";
var HQ_AUTH_MAX_SKEW_MS = 5 * 60 * 1e3;
var HQ_AUTH_NONCE_TTL_MS = 10 * 60 * 1e3;
var AUTH_FAILURE_STATUS = {
  "hq.unauthorized": 401,
  "hq.invalid_signature": 403,
  "hq.replay": 409,
  "hq.invalid_request": 400
};
function sha256Hex(input) {
  return (0, import_node_crypto.createHash)("sha256").update(input, "utf8").digest("hex");
}
function buildCanonicalString(params) {
  return [
    params.method.toUpperCase(),
    params.pathWithQuery,
    params.timestamp,
    params.nonce,
    sha256Hex(params.rawBody ?? "")
  ].join("\n");
}
function hmacHex(secret, canonical) {
  return (0, import_node_crypto.createHmac)("sha256", secret).update(canonical, "utf8").digest("hex");
}
function signHqRequest(input) {
  const timestamp = String(input.timestamp ?? Date.now());
  const nonce = input.nonce ?? crypto.randomUUID();
  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null
  });
  return {
    [HQ_AUTH_HEADERS.clientId]: input.clientId,
    [HQ_AUTH_HEADERS.timestamp]: timestamp,
    [HQ_AUTH_HEADERS.nonce]: nonce,
    [HQ_AUTH_HEADERS.version]: HQ_AUTH_VERSION,
    [HQ_AUTH_HEADERS.signature]: hmacHex(input.secret, canonical)
  };
}
function createMemoryNonceStore(now = Date.now) {
  const seen = /* @__PURE__ */ new Map();
  return {
    async consume(nonce, expiresAtMs) {
      const current = now();
      for (const [key, expiry] of seen) {
        if (expiry <= current) seen.delete(key);
      }
      if (seen.has(nonce)) return false;
      seen.set(nonce, expiresAtMs);
      return true;
    }
  };
}
function readHeader(headers, name) {
  const value = headers.get(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}
async function verifyHqRequest(input) {
  const clientId = readHeader(input.headers, HQ_AUTH_HEADERS.clientId);
  const timestamp = readHeader(input.headers, HQ_AUTH_HEADERS.timestamp);
  const nonce = readHeader(input.headers, HQ_AUTH_HEADERS.nonce);
  const signature = readHeader(input.headers, HQ_AUTH_HEADERS.signature);
  const version = readHeader(input.headers, HQ_AUTH_HEADERS.version);
  if (!clientId || !timestamp || !nonce || !signature) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Missing HQ auth headers"
    };
  }
  if (version && version !== HQ_AUTH_VERSION) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unsupported HQ auth version"
    };
  }
  const parsedTimestamp = Number(timestamp);
  const now = input.now ?? Date.now();
  const maxSkew = input.maxSkewMs ?? HQ_AUTH_MAX_SKEW_MS;
  if (!Number.isFinite(parsedTimestamp) || Math.abs(now - parsedTimestamp) > maxSkew) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Timestamp outside allowed skew"
    };
  }
  if (!input.secret) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unknown or inactive client"
    };
  }
  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null
  });
  const expected = hmacHex(input.secret, canonical);
  const provided = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  if (provided.length !== wanted.length || !(0, import_node_crypto.timingSafeEqual)(provided, wanted)) {
    return {
      ok: false,
      code: "hq.invalid_signature",
      status: AUTH_FAILURE_STATUS["hq.invalid_signature"],
      message: "Invalid signature"
    };
  }
  if (input.nonceStore) {
    const accepted = await input.nonceStore.consume(
      nonce,
      parsedTimestamp + HQ_AUTH_NONCE_TTL_MS
    );
    if (!accepted) {
      return {
        ok: false,
        code: "hq.replay",
        status: AUTH_FAILURE_STATUS["hq.replay"],
        message: "Nonce already used"
      };
    }
  }
  return { ok: true, clientId };
}
function authFailureBody(code) {
  return { error: { code, message: code } };
}

// src/product.ts
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

// src/collector.ts
var collector_exports = {};
__export(collector_exports, {
  collectorErrorResponseSchema: () => collectorErrorResponseSchema,
  cursorPageSchema: () => cursorPageSchema,
  deploymentDetailSchema: () => deploymentDetailSchema,
  deploymentSchema: () => deploymentSchema,
  errorGroupDetailSchema: () => errorGroupDetailSchema,
  errorGroupNoteSchema: () => errorGroupNoteSchema,
  errorGroupPatchRequestSchema: () => errorGroupPatchRequestSchema,
  errorGroupPatchResponseSchema: () => errorGroupPatchResponseSchema,
  errorGroupSchema: () => errorGroupSchema,
  errorOccurrenceSchema: () => errorOccurrenceSchema,
  errorSeveritySchema: () => errorSeveritySchema,
  errorStatusSchema: () => errorStatusSchema,
  externalServiceSchema: () => externalServiceSchema,
  healthSnapshotSchema: () => healthSnapshotSchema,
  incidentCreateRequestSchema: () => incidentCreateRequestSchema,
  incidentPatchRequestSchema: () => incidentPatchRequestSchema,
  incidentResponseSchema: () => incidentResponseSchema,
  incidentSchema: () => incidentSchema,
  liveSnapshotSchema: () => liveSnapshotSchema,
  occurrenceResponseSchema: () => occurrenceResponseSchema,
  overviewSchema: () => overviewSchema,
  serviceDetailSchema: () => serviceDetailSchema,
  serviceSummarySchema: () => serviceSummarySchema,
  traceResponseSchema: () => traceResponseSchema,
  webhookDetailSchema: () => webhookDetailSchema,
  webhookExecutionSchema: () => webhookExecutionSchema
});
var import_zod2 = require("zod");
var iso = import_zod2.z.string().min(10).refine((value) => !Number.isNaN(Date.parse(value)), "invalid date");
var nullableIso = iso.nullable().optional();
var errorSeveritySchema = import_zod2.z.enum(["critical", "error", "warning", "info"]);
var errorStatusSchema = import_zod2.z.enum([
  "new",
  "open",
  "acknowledged",
  "resolved",
  "ignored",
  "regressed"
]);
var errorGroupSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  service: import_zod2.z.string(),
  environment: import_zod2.z.string(),
  fingerprint: import_zod2.z.string(),
  title: import_zod2.z.string(),
  message: import_zod2.z.string(),
  category: import_zod2.z.string(),
  errorType: import_zod2.z.string(),
  errorCode: import_zod2.z.string().nullable().optional(),
  severity: errorSeveritySchema,
  status: errorStatusSchema,
  operation: import_zod2.z.string().nullable().optional(),
  provider: import_zod2.z.string().nullable().optional(),
  firstSeenAt: iso,
  lastSeenAt: iso,
  occurrenceCount: import_zod2.z.number().int().nonnegative(),
  affectedUserCount: import_zod2.z.number().int().nonnegative().optional(),
  firstDeploymentId: import_zod2.z.string().nullable().optional(),
  lastDeploymentId: import_zod2.z.string().nullable().optional(),
  isRegression: import_zod2.z.boolean().optional(),
  regressionCount: import_zod2.z.number().int().nonnegative().optional(),
  assignedTo: import_zod2.z.string().nullable().optional(),
  assignedTeam: import_zod2.z.string().nullable().optional(),
  internalNote: import_zod2.z.string().nullable().optional(),
  resolvedAt: nullableIso,
  ignoredAt: nullableIso,
  acknowledgedAt: nullableIso,
  returnedAt: nullableIso,
  createdAt: iso,
  updatedAt: iso
});
var errorGroupNoteSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  groupId: import_zod2.z.string(),
  author: import_zod2.z.string(),
  body: import_zod2.z.string(),
  createdAt: iso
});
var errorOccurrenceSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  groupId: import_zod2.z.string(),
  eventId: import_zod2.z.string(),
  service: import_zod2.z.string(),
  environment: import_zod2.z.string(),
  timestamp: iso,
  message: import_zod2.z.string(),
  stack: import_zod2.z.string().nullable().optional(),
  traceId: import_zod2.z.string().nullable().optional(),
  spanId: import_zod2.z.string().nullable().optional(),
  requestId: import_zod2.z.string().nullable().optional(),
  route: import_zod2.z.string().nullable().optional(),
  method: import_zod2.z.string().nullable().optional(),
  operation: import_zod2.z.string().nullable().optional(),
  deploymentId: import_zod2.z.string().nullable().optional(),
  gitCommit: import_zod2.z.string().nullable().optional(),
  market: import_zod2.z.string().nullable().optional(),
  locale: import_zod2.z.string().nullable().optional(),
  userId: import_zod2.z.string().nullable().optional(),
  accountId: import_zod2.z.string().nullable().optional(),
  entityType: import_zod2.z.string().nullable().optional(),
  entityId: import_zod2.z.string().nullable().optional(),
  provider: import_zod2.z.string().nullable().optional(),
  statusCode: import_zod2.z.number().int().nullable().optional(),
  latencyMs: import_zod2.z.number().int().nullable().optional(),
  category: import_zod2.z.string().optional(),
  severity: errorSeveritySchema.optional(),
  metadata: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown()).nullable().optional(),
  createdAt: iso
});
var serviceSummarySchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  service: import_zod2.z.string(),
  displayName: import_zod2.z.string(),
  criticality: import_zod2.z.string().optional(),
  owner: import_zod2.z.string().nullable().optional(),
  repository: import_zod2.z.string().nullable().optional(),
  vercelProject: import_zod2.z.string().nullable().optional(),
  dependencies: import_zod2.z.array(import_zod2.z.string()).optional(),
  docsUrl: import_zod2.z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var deploymentSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  service: import_zod2.z.string(),
  providerDeploymentId: import_zod2.z.string().optional(),
  provider: import_zod2.z.string().optional(),
  environment: import_zod2.z.string(),
  gitCommit: import_zod2.z.string().nullable().optional(),
  gitBranch: import_zod2.z.string().nullable().optional(),
  version: import_zod2.z.string().nullable().optional(),
  startedAt: nullableIso,
  completedAt: nullableIso,
  status: import_zod2.z.string(),
  metrics: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown()).nullable().optional(),
  metadata: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown()).nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var incidentSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  title: import_zod2.z.string(),
  severity: errorSeveritySchema,
  status: import_zod2.z.string(),
  startedAt: iso,
  detectedAt: iso.optional(),
  acknowledgedAt: nullableIso,
  resolvedAt: nullableIso,
  affectedServices: import_zod2.z.array(import_zod2.z.string()).optional(),
  affectedMarkets: import_zod2.z.array(import_zod2.z.string()).optional(),
  summary: import_zod2.z.string().nullable().optional(),
  suspectedDeploymentId: import_zod2.z.string().nullable().optional(),
  createdBy: import_zod2.z.string().nullable().optional(),
  acknowledgedBy: import_zod2.z.string().nullable().optional(),
  resolvedBy: import_zod2.z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var healthSnapshotSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  service: import_zod2.z.string(),
  environment: import_zod2.z.string(),
  timestamp: iso,
  requestCount: import_zod2.z.number().int().nonnegative().optional(),
  errorCount: import_zod2.z.number().int().nonnegative().optional(),
  errorRate: import_zod2.z.number().optional(),
  p50Latency: import_zod2.z.number().int().nullable().optional(),
  p95Latency: import_zod2.z.number().int().nullable().optional(),
  p99Latency: import_zod2.z.number().int().nullable().optional(),
  status: import_zod2.z.string(),
  createdAt: iso
});
var webhookExecutionSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  service: import_zod2.z.string(),
  provider: import_zod2.z.string(),
  eventType: import_zod2.z.string(),
  externalEventId: import_zod2.z.string().nullable().optional(),
  receivedAt: iso,
  processingStartedAt: nullableIso,
  processingCompletedAt: nullableIso,
  durationMs: import_zod2.z.number().int().nullable().optional(),
  status: import_zod2.z.string(),
  attempts: import_zod2.z.number().int().nonnegative().optional(),
  idempotencyResult: import_zod2.z.string().nullable().optional(),
  errorCode: import_zod2.z.string().nullable().optional(),
  traceId: import_zod2.z.string().nullable().optional(),
  requestId: import_zod2.z.string().nullable().optional(),
  errorGroupId: import_zod2.z.string().nullable().optional(),
  metadata: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown()).nullable().optional(),
  createdAt: iso
});
var cursorPageSchema = (item) => import_zod2.z.object({
  items: import_zod2.z.array(item),
  nextCursor: import_zod2.z.string().nullable().optional(),
  limit: import_zod2.z.number().int().positive().optional()
});
var errorGroupDetailSchema = import_zod2.z.object({
  group: errorGroupSchema,
  notes: import_zod2.z.array(errorGroupNoteSchema),
  recentOccurrences: import_zod2.z.array(errorOccurrenceSchema)
});
var serviceDetailSchema = import_zod2.z.object({
  service: serviceSummarySchema,
  groups: import_zod2.z.array(errorGroupSchema),
  deployments: import_zod2.z.array(deploymentSchema)
});
var deploymentDetailSchema = import_zod2.z.object({
  deployment: deploymentSchema,
  comparison: import_zod2.z.object({
    newFingerprints: import_zod2.z.array(errorGroupSchema),
    resolvedFingerprints: import_zod2.z.array(errorGroupSchema),
    regressions: import_zod2.z.array(errorGroupSchema),
    errorRateDelta: import_zod2.z.number().nullable()
  })
});
var webhookDetailSchema = import_zod2.z.object({
  webhook: webhookExecutionSchema,
  errorGroup: errorGroupSchema.nullable()
});
var occurrenceResponseSchema = import_zod2.z.object({
  occurrence: errorOccurrenceSchema
});
var incidentResponseSchema = import_zod2.z.object({
  incident: incidentSchema
});
var errorGroupPatchResponseSchema = import_zod2.z.object({
  group: errorGroupSchema,
  note: errorGroupNoteSchema.nullable().optional()
});
var traceResponseSchema = import_zod2.z.object({
  traceId: import_zod2.z.string(),
  occurrenceCount: import_zod2.z.number().int().nonnegative(),
  occurrences: import_zod2.z.array(errorOccurrenceSchema),
  externalTraceUrl: import_zod2.z.string().nullable().optional(),
  rawTraceStored: import_zod2.z.boolean()
});
var externalServiceSchema = import_zod2.z.object({
  provider: import_zod2.z.string(),
  groups: import_zod2.z.number().int().nonnegative(),
  occurrences: import_zod2.z.number().int().nonnegative(),
  critical: import_zod2.z.number().int().nonnegative(),
  services: import_zod2.z.array(import_zod2.z.string()),
  lastSeenAt: nullableIso
});
var overviewSchema = import_zod2.z.object({
  generatedAt: iso,
  services: import_zod2.z.number().int().nonnegative(),
  openIncidents: import_zod2.z.number().int().nonnegative(),
  totalGroups: import_zod2.z.number().int().nonnegative(),
  errorGroups: import_zod2.z.object({
    recent: import_zod2.z.number().int().nonnegative(),
    open: import_zod2.z.number().int().nonnegative(),
    critical: import_zod2.z.number().int().nonnegative()
  }),
  recentAlertEvents: import_zod2.z.array(import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown())),
  recentDeployments: import_zod2.z.array(deploymentSchema),
  recentHealthSnapshots: import_zod2.z.array(healthSnapshotSchema),
  recentGroups: import_zod2.z.array(errorGroupSchema)
});
var liveSnapshotSchema = import_zod2.z.object({
  generatedAt: import_zod2.z.string().nullable(),
  degraded: import_zod2.z.object({ redis: import_zod2.z.boolean(), db: import_zod2.z.boolean() }),
  services: import_zod2.z.array(
    import_zod2.z.object({
      service: import_zod2.z.string(),
      errors1m: import_zod2.z.number().nullable(),
      errors5m: import_zod2.z.number().nullable(),
      errorsPerMin5m: import_zod2.z.number().nullable(),
      errorRate1m: import_zod2.z.number().nullable(),
      affectedUsers5m: import_zod2.z.number().nullable()
    })
  ),
  spikes: import_zod2.z.array(
    import_zod2.z.object({
      fingerprint: import_zod2.z.string(),
      service: import_zod2.z.string().nullable(),
      operation: import_zod2.z.string().nullable(),
      count1m: import_zod2.z.number().nullable(),
      baselinePerMin: import_zod2.z.number().nullable(),
      ratio: import_zod2.z.number().nullable()
    })
  ),
  cooldowns: import_zod2.z.array(
    import_zod2.z.object({
      ruleId: import_zod2.z.string(),
      until: import_zod2.z.string().nullable()
    })
  ),
  unknown: import_zod2.z.array(import_zod2.z.string())
});
var incidentCreateRequestSchema = import_zod2.z.object({
  title: import_zod2.z.string().min(1).max(200),
  severity: errorSeveritySchema.default("critical"),
  status: import_zod2.z.string().default("open"),
  startedAt: iso.optional(),
  affectedServices: import_zod2.z.array(import_zod2.z.string().min(1)).default([]),
  affectedMarkets: import_zod2.z.array(import_zod2.z.string().min(1)).default([]),
  summary: import_zod2.z.string().max(1e4).optional(),
  suspectedDeploymentId: import_zod2.z.string().optional(),
  createdBy: import_zod2.z.string().optional()
}).strict();
var incidentPatchRequestSchema = import_zod2.z.object({
  title: import_zod2.z.string().min(1).max(200).optional(),
  severity: errorSeveritySchema.optional(),
  status: import_zod2.z.string().optional(),
  summary: import_zod2.z.string().max(1e4).optional(),
  acknowledgedBy: import_zod2.z.string().optional(),
  resolvedBy: import_zod2.z.string().optional()
}).strict();
var errorGroupPatchRequestSchema = import_zod2.z.object({
  status: errorStatusSchema.optional(),
  severity: errorSeveritySchema.optional(),
  assignedTo: import_zod2.z.string().nullable().optional(),
  assignedTeam: import_zod2.z.string().nullable().optional(),
  note: import_zod2.z.string().max(1e4).optional(),
  internalNote: import_zod2.z.string().nullable().optional()
}).strict();
var collectorErrorResponseSchema = import_zod2.z.object({
  error: import_zod2.z.string(),
  message: import_zod2.z.string(),
  details: import_zod2.z.unknown().optional()
});

// src/fixtures.ts
var NOW = "2026-10-31T12:00:00.000Z";
var manifestFixture = {
  schemaVersion: "1.0.0",
  product: { name: "SoundLaunch", slug: "soundlaunch", environment: "production" },
  capabilities: ["events", "health", "lookup"],
  eventTypes: ["customer.created", "order.paid", "error.created"],
  endpoints: {
    manifest: "GET /internal/hq/manifest",
    events: "GET /internal/hq/events",
    health: "GET /internal/hq/health",
    lookupCustomer: "GET /internal/hq/customers/:id",
    lookupOrder: "GET /internal/hq/orders/:id",
    lookupPayment: "GET /internal/hq/payments/:id"
  },
  limits: { defaultLimit: 500, maxLimit: 1e3 },
  cursorType: "timestamp_id"
};
var eventsPageFixture = {
  data: [
    {
      id: "evt_fixture_1",
      event: "order.paid",
      aggregateType: "order",
      aggregateId: "ord_fixture_1",
      idempotencyKey: "soundlaunch:order.paid:ord_fixture_1",
      occurredAt: NOW,
      payload: {
        id: "ord_fixture_1",
        orderNumber: "SL-2026-0042",
        customerId: "cust_fixture_1",
        customerEmail: "emma@example.com",
        orderType: "release",
        status: "completed",
        paymentStatus: "paid",
        amountCents: 49900,
        currency: "EUR",
        provider: "stripe",
        paidAt: NOW,
        createdAt: NOW,
        updatedAt: NOW
      }
    }
  ],
  pagination: { nextCursor: `${NOW}|evt_fixture_1`, hasMore: false }
};
var healthFixture = {
  status: "healthy",
  product: "SoundLaunch",
  version: "1.0.0",
  environment: "production",
  checks: { database: "ok" },
  timestamp: NOW
};
var errorEventFixture = {
  eventId: "evt_error_fixture_1",
  service: "soundlaunch",
  environment: "production",
  timestamp: NOW,
  errorType: "TypeError",
  message: "Cannot read properties of undefined",
  severity: "error",
  operation: "release.publish",
  category: "application"
};
var CUSTOMER_FIXTURE = {
  id: "cust_fixture_1",
  email: "emma@example.com",
  name: "Emma Virtanen",
  createdAt: NOW,
  updatedAt: NOW
};
var ORDER_FIXTURE = eventsPageFixture.data[0].payload;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CAPABILITIES,
  CHECK_STATUSES,
  CUSTOMER_FIXTURE,
  DEFAULT_ENDPOINTS,
  EVENT_NAMES,
  HEALTH_STATUSES,
  HQ_AUTH_HEADERS,
  HQ_AUTH_MAX_SKEW_MS,
  HQ_AUTH_NONCE_TTL_MS,
  HQ_AUTH_VERSION,
  HQ_ENVIRONMENTS,
  ORDER_FIXTURE,
  adminFeatureRouteSchema,
  adminFeatureSchema,
  adminFeaturesManifestSchema,
  authFailureBody,
  buildCanonicalString,
  collector,
  createMemoryNonceStore,
  customerDtoSchema,
  deriveHealthStatus,
  endpointSchema,
  errorEventFixture,
  eventsPageFixture,
  eventsPageSchema,
  healthFixture,
  hmacHex,
  hqCapabilitySchema,
  hqEnvironmentSchema,
  hqErrorResponseSchema,
  hqEventNameSchema,
  hqEventSchema,
  hqHealthSchema,
  hqManifestSchema,
  lookupResponseSchema,
  manifestEndpointsSchema,
  manifestFixture,
  orderDtoSchema,
  parseEndpoint,
  paymentDtoSchema,
  sha256Hex,
  signHqRequest,
  supportContextInputSchema,
  supportContextSchema,
  verifyHqRequest
});
//# sourceMappingURL=index.cjs.map