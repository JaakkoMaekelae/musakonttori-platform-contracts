import "../chunk-ZMNCURDE.js";
import {
  DEFAULT_ENDPOINTS,
  adminFeaturesManifestSchema,
  customerDtoSchema,
  deriveHealthStatus,
  eventsPageSchema,
  hqEventSchema,
  hqHealthSchema,
  hqManifestSchema,
  orderDtoSchema,
  paymentDtoSchema,
  supportContextInputSchema,
  supportContextSchema
} from "../chunk-I4G6HTHC.js";
import "../chunk-UCAV2NZM.js";
import {
  authFailureBody,
  signHqRequest,
  verifyHqRequest
} from "../chunk-LB2VRZIE.js";
import "../chunk-TMJPB5PV.js";
import "../chunk-PZ5AY32C.js";

// src/integration/config.ts
var HQ_CONTRACT_VERSION = "1.0.0";
var DEFAULT_LIMITS = { defaultLimit: 500, maxLimit: 1e3 };
function createHqConfig(config) {
  return config;
}
function buildManifest(config) {
  const capabilities = new Set(config.capabilities);
  const endpoints = {
    ...DEFAULT_ENDPOINTS,
    ...config.endpoints
  };
  if (!capabilities.has("events")) delete endpoints.events;
  if (!config.getCustomer) delete endpoints.lookupCustomer;
  if (!config.getOrder) delete endpoints.lookupOrder;
  if (!config.getPayment) delete endpoints.lookupPayment;
  if (!config.getAdminFeatures) delete endpoints.adminFeatures;
  if (!config.getSupportContext) delete endpoints.supportContext;
  return hqManifestSchema.parse({
    schemaVersion: HQ_CONTRACT_VERSION,
    product: config.product,
    capabilities: config.capabilities,
    eventTypes: config.eventTypes,
    endpoints,
    limits: { ...DEFAULT_LIMITS, ...config.limits },
    cursorType: "timestamp_id"
  });
}
function buildHealth(config, data) {
  return {
    status: deriveHealthStatus(data.checks),
    product: config.product.slug,
    version: data.version,
    environment: config.product.environment,
    checks: data.checks,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/integration/core.ts
var HqIntegrationError = class extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "HqIntegrationError";
  }
  status;
  code;
  details;
};
function errorBody(code, message, details) {
  return { error: { code, message, ...details === void 0 ? {} : { details } } };
}
function matchSubPath(pathname) {
  const match = pathname.match(/\/internal\/hq(?:\/(.*))?$/);
  if (!match) return null;
  return match[1] ?? "";
}
function segmentId(subPath, prefix) {
  if (!subPath.startsWith(prefix)) return null;
  const id = decodeURIComponent(subPath.slice(prefix.length));
  return id.length > 0 && !id.includes("/") ? id : null;
}
async function dispatchHqRequest(config, request) {
  const url = new URL(request.url, "http://localhost");
  const subPath = matchSubPath(url.pathname);
  if (subPath === null) {
    return { status: 404, body: errorBody("hq.not_found", "Not an HQ route") };
  }
  try {
    const clientId = request.headers.get("x-hq-client-id") ?? null;
    const secret = clientId ? await config.getClientSecret(clientId) : null;
    const auth = await verifyHqRequest({
      method: request.method,
      pathWithQuery: url.pathname + url.search,
      headers: request.headers,
      secret,
      rawBody: request.rawBody ?? "",
      ...config.consumeNonce ? { nonceStore: { consume: config.consumeNonce.bind(config) } } : {}
    });
    if (!auth.ok) {
      return { status: auth.status, body: authFailureBody(auth.code) };
    }
    if (subPath === "manifest") {
      if (request.method !== "GET") {
        return { status: 405, body: errorBody("hq.method_not_allowed", "Use GET") };
      }
      return { status: 200, body: buildManifest(config) };
    }
    if (subPath === "events") {
      if (request.method !== "GET") {
        return { status: 405, body: errorBody("hq.method_not_allowed", "Use GET") };
      }
      if (!config.listEvents) {
        return { status: 404, body: errorBody("hq.not_supported", "events capability not enabled") };
      }
      const limits = { defaultLimit: 500, maxLimit: 1e3, ...config.limits };
      const limitParam = Number(url.searchParams.get("limit") ?? "");
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), limits.maxLimit ?? 1e3) : limits.defaultLimit ?? 500;
      const cursor = url.searchParams.get("cursor");
      const since = url.searchParams.get("since");
      const page = await config.listEvents({
        limit,
        ...cursor ? { cursor } : {},
        ...since ? { since } : {}
      });
      const parsed = eventsPageSchema.safeParse({
        data: page.data,
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore }
      });
      if (!parsed.success) {
        config.onError?.(parsed.error, { path: subPath, method: request.method });
        return { status: 500, body: errorBody("hq.internal", "Invalid event projection") };
      }
      return { status: 200, body: parsed.data };
    }
    if (subPath === "health") {
      if (request.method !== "GET") {
        return { status: 405, body: errorBody("hq.method_not_allowed", "Use GET") };
      }
      const health = buildHealth(config, await config.health());
      const parsed = hqHealthSchema.safeParse(health);
      if (!parsed.success) {
        config.onError?.(parsed.error, { path: subPath, method: request.method });
        return { status: 500, body: errorBody("hq.internal", "Invalid health projection") };
      }
      return { status: 200, body: parsed.data };
    }
    if (subPath === "admin-features") {
      if (request.method !== "GET") {
        return { status: 405, body: errorBody("hq.method_not_allowed", "Use GET") };
      }
      if (!config.getAdminFeatures) {
        return { status: 404, body: errorBody("hq.not_supported", "admin_features not enabled") };
      }
      return { status: 200, body: adminFeaturesManifestSchema.parse(await config.getAdminFeatures()) };
    }
    if (subPath === "support-context") {
      if (request.method !== "POST") {
        return { status: 405, body: errorBody("hq.method_not_allowed", "Use POST") };
      }
      if (!config.getSupportContext) {
        return { status: 404, body: errorBody("hq.not_supported", "support_context not enabled") };
      }
      let body;
      try {
        body = (request.rawBody ?? "").length > 0 ? JSON.parse(request.rawBody) : null;
      } catch {
        return { status: 400, body: errorBody("hq.invalid_request", "Invalid JSON") };
      }
      const parsed = supportContextInputSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          body: errorBody("hq.invalid_request", "Invalid body", parsed.error.flatten())
        };
      }
      return { status: 200, body: supportContextSchema.parse(await config.getSupportContext(parsed.data)) };
    }
    const customerId = segmentId(subPath, "customers/");
    if (customerId) {
      if (!config.getCustomer) {
        return { status: 404, body: errorBody("hq.not_supported", "lookup not enabled") };
      }
      const customer = await config.getCustomer(customerId);
      if (!customer) return { status: 404, body: errorBody("hq.not_found", "Customer not found") };
      return { status: 200, body: { data: customerDtoSchema.parse(customer) } };
    }
    const orderId = segmentId(subPath, "orders/");
    if (orderId) {
      if (!config.getOrder) {
        return { status: 404, body: errorBody("hq.not_supported", "lookup not enabled") };
      }
      const order = await config.getOrder(orderId);
      if (!order) return { status: 404, body: errorBody("hq.not_found", "Order not found") };
      return { status: 200, body: { data: orderDtoSchema.parse(order) } };
    }
    const paymentId = segmentId(subPath, "payments/");
    if (paymentId) {
      if (!config.getPayment) {
        return { status: 404, body: errorBody("hq.not_supported", "lookup not enabled") };
      }
      const payment = await config.getPayment(paymentId);
      if (!payment) return { status: 404, body: errorBody("hq.not_found", "Payment not found") };
      return { status: 200, body: { data: paymentDtoSchema.parse(payment) } };
    }
    return { status: 404, body: errorBody("hq.not_found", `Unknown HQ path: ${subPath}`) };
  } catch (error) {
    config.onError?.(error, { path: subPath, method: request.method });
    return { status: 500, body: errorBody("hq.internal", "HQ integration error") };
  }
}

// src/integration/next.ts
function toResponse(result) {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
async function readBody(request) {
  try {
    return await request.text();
  } catch {
    return "";
  }
}
function createHqRoutes(config) {
  async function dispatch(request, method) {
    const rawBody = method === "GET" ? "" : await readBody(request);
    const result = await dispatchHqRequest(config, {
      method,
      url: request.url,
      headers: request.headers,
      rawBody
    });
    return toResponse(result);
  }
  return {
    GET: (request) => dispatch(request, "GET"),
    POST: (request) => dispatch(request, "POST")
  };
}

// src/integration/fastify.ts
function headerSource(headers) {
  return {
    get(name) {
      const value = headers[name.toLowerCase()] ?? headers[name];
      if (Array.isArray(value)) return value[0] ?? null;
      return value ?? null;
    }
  };
}
function rawBodyOf(request) {
  if (typeof request.rawBody === "string") return request.rawBody;
  if (request.body === void 0) return "";
  return JSON.stringify(request.body);
}
async function run(config, request, reply, method) {
  const result = await dispatchHqRequest(config, {
    method,
    url: request.url,
    headers: headerSource(request.headers),
    rawBody: method === "GET" ? "" : rawBodyOf(request)
  });
  reply.code(result.status).send(result.body);
}
function createHqFastifyPlugin(config) {
  return async (app) => {
    if (app.removeContentTypeParser && app.addContentTypeParser) {
      app.removeContentTypeParser("application/json");
      app.addContentTypeParser(
        "application/json",
        { parseAs: "string" },
        (request, body, done) => {
          request.rawBody = body;
          try {
            done(null, body.length > 0 ? JSON.parse(body) : {});
          } catch (error) {
            done(error);
          }
        }
      );
    }
    app.get("/internal/hq/manifest", (request, reply) => run(config, request, reply, "GET"));
    app.get("/internal/hq/events", (request, reply) => run(config, request, reply, "GET"));
    app.get("/internal/hq/health", (request, reply) => run(config, request, reply, "GET"));
    app.get("/internal/hq/admin-features", (request, reply) => run(config, request, reply, "GET"));
    app.post("/internal/hq/support-context", (request, reply) => run(config, request, reply, "POST"));
    app.get("/internal/hq/customers/:id", (request, reply) => run(config, request, reply, "GET"));
    app.get("/internal/hq/orders/:id", (request, reply) => run(config, request, reply, "GET"));
    app.get("/internal/hq/payments/:id", (request, reply) => run(config, request, reply, "GET"));
  };
}

// src/integration/outbox.ts
function createHqEvent(input) {
  const occurredAt = input.occurredAt ?? /* @__PURE__ */ new Date();
  const iso = occurredAt instanceof Date ? occurredAt.toISOString() : occurredAt;
  const event = {
    id: input.id ?? crypto.randomUUID(),
    event: input.event,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    idempotencyKey: input.idempotencyKey ?? `${input.event}:${input.aggregateId}:${iso}`,
    occurredAt: iso,
    payload: input.payload
  };
  return hqEventSchema.parse(event);
}
async function emitHqEvent(store, input) {
  const event = createHqEvent(input);
  await store.insert({ eventId: event.id, event, createdAt: /* @__PURE__ */ new Date() });
  return event;
}

// src/integration/testing.ts
function signed(options, input) {
  const headers = signHqRequest({
    method: input.method,
    pathWithQuery: input.path,
    clientId: options.clientId,
    secret: options.secret,
    rawBody: input.body ?? null
  });
  return { ...input, headers: { ...headers, ...input.headers ?? {} } };
}
function assert(condition, message) {
  if (!condition) throw new Error(`HQ contract test failed: ${message}`);
}
async function assertHqContract(options) {
  const anonymous = await options.request({ method: "GET", path: "/internal/hq/manifest" });
  assert(anonymous.status === 401, `manifest without auth must be 401, got ${anonymous.status}`);
  const manifestResponse = await options.request(
    signed(options, { method: "GET", path: "/internal/hq/manifest" })
  );
  assert(manifestResponse.status === 200, `manifest must be 200, got ${manifestResponse.status}`);
  const manifest = hqManifestSchema.parse(manifestResponse.body);
  assert(manifest.schemaVersion.startsWith("1."), "manifest schemaVersion must be 1.x");
  assert(manifest.product.slug === options.config.product.slug, "manifest slug mismatch");
  const healthResponse = await options.request(
    signed(options, { method: "GET", path: "/internal/hq/health" })
  );
  assert(healthResponse.status === 200, `health must be 200, got ${healthResponse.status}`);
  const health = hqHealthSchema.parse(healthResponse.body);
  assert(
    health.status === deriveHealthStatus(health.checks),
    "health status must be derived from checks"
  );
  if (options.config.capabilities.includes("events") && options.config.listEvents) {
    const eventsResponse = await options.request(
      signed(options, { method: "GET", path: "/internal/hq/events?limit=10" })
    );
    assert(eventsResponse.status === 200, `events must be 200, got ${eventsResponse.status}`);
    eventsPageSchema.parse(eventsResponse.body);
  }
  if (options.config.capabilities.includes("lookup")) {
    const lookups = [
      options.config.getCustomer ? "/internal/hq/customers/contract-test-missing" : null,
      options.config.getOrder ? "/internal/hq/orders/contract-test-missing" : null,
      options.config.getPayment ? "/internal/hq/payments/contract-test-missing" : null
    ].filter((path) => path !== null);
    for (const path of lookups) {
      const response = await options.request(signed(options, { method: "GET", path }));
      assert(response.status !== 500, `${path} must not 500 for a missing id`);
      assert(response.status === 404, `${path} must be 404 for a missing id`);
    }
  }
  const unsignedHealth = await options.request({ method: "GET", path: "/internal/hq/health" });
  assert(unsignedHealth.status === 401, `health without auth must be 401, got ${unsignedHealth.status}`);
}
export {
  DEFAULT_LIMITS,
  HQ_CONTRACT_VERSION,
  HqIntegrationError,
  assertHqContract,
  buildHealth,
  buildManifest,
  createHqConfig,
  createHqEvent,
  createHqFastifyPlugin,
  createHqRoutes,
  dispatchHqRequest,
  emitHqEvent
};
//# sourceMappingURL=index.js.map