import {
  adminFeaturesManifestSchema,
  authFailureBody,
  customerDtoSchema,
  eventsPageSchema,
  hqHealthSchema,
  orderDtoSchema,
  paymentDtoSchema,
  supportContextInputSchema,
  supportContextSchema,
  verifyHqRequest,
  type HeaderSource,
  type HqAuthFailureCode,
} from "@musakonttori/platform-contracts";

import { buildHealth, buildManifest, type HqConfig } from "./config";

export type HqHttpMethod = "GET" | "POST";

export interface HqCoreRequest {
  method: HqHttpMethod;
  /** Absolute URL or path+query. Both are accepted. */
  url: string;
  headers: HeaderSource;
  rawBody?: string;
}

export interface HqCoreResponse {
  status: number;
  body: unknown;
}

export class HqIntegrationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "HqIntegrationError";
  }
}

function errorBody(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } };
}

function matchSubPath(pathname: string): string | null {
  const match = pathname.match(/\/internal\/hq(?:\/(.*))?$/);
  if (!match) return null;
  return match[1] ?? "";
}

function segmentId(subPath: string, prefix: string): string | null {
  if (!subPath.startsWith(prefix)) return null;
  const id = decodeURIComponent(subPath.slice(prefix.length));
  return id.length > 0 && !id.includes("/") ? id : null;
}

/**
 * Framework-independent HQ request dispatcher. Both the Next adapter and the
 * Fastify adapter call this function, so behaviour cannot drift.
 */
export async function dispatchHqRequest(
  config: HqConfig,
  request: HqCoreRequest
): Promise<HqCoreResponse> {
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
      ...(config.consumeNonce
        ? { nonceStore: { consume: config.consumeNonce.bind(config) } }
        : {}),
    });

    if (!auth.ok) {
      return { status: auth.status, body: authFailureBody(auth.code as HqAuthFailureCode) };
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
      const limits = { defaultLimit: 500, maxLimit: 1000, ...config.limits };
      const limitParam = Number(url.searchParams.get("limit") ?? "");
      const limit =
        Number.isFinite(limitParam) && limitParam > 0
          ? Math.min(Math.floor(limitParam), limits.maxLimit ?? 1000)
          : limits.defaultLimit ?? 500;
      const cursor = url.searchParams.get("cursor");
      const since = url.searchParams.get("since");

      const page = await config.listEvents({
        limit,
        ...(cursor ? { cursor } : {}),
        ...(since ? { since } : {}),
      });

      const parsed = eventsPageSchema.safeParse({
        data: page.data,
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore },
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
      let body: unknown;
      try {
        body = (request.rawBody ?? "").length > 0 ? JSON.parse(request.rawBody as string) : null;
      } catch {
        return { status: 400, body: errorBody("hq.invalid_request", "Invalid JSON") };
      }
      const parsed = supportContextInputSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          body: errorBody("hq.invalid_request", "Invalid body", parsed.error.flatten()),
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
