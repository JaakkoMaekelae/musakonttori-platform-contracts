import {
  deriveHealthStatus,
  eventsPageSchema,
  hqHealthSchema,
  hqManifestSchema,
  signHqRequest,
} from "@musakonttori/platform-contracts";

import type { HqConfig } from "./config";

export interface HqContractTestRequestInput {
  method: "GET" | "POST";
  path: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface HqContractTestResponse {
  status: number;
  body: unknown;
}

export type HqContractTestRequest = (
  input: HqContractTestRequestInput
) => Promise<HqContractTestResponse>;

export interface HqContractTestOptions {
  request: HqContractTestRequest;
  config: HqConfig;
  clientId: string;
  secret: string;
}

function signed(
  options: HqContractTestOptions,
  input: HqContractTestRequestInput
): HqContractTestRequestInput {
  const headers = signHqRequest({
    method: input.method,
    pathWithQuery: input.path,
    clientId: options.clientId,
    secret: options.secret,
    rawBody: input.body ?? null,
  });
  return { ...input, headers: { ...headers, ...(input.headers ?? {}) } };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`HQ contract test failed: ${message}`);
}

/**
 * The identical contract suite every service runs against its own routes.
 * Framework-specific tests only provide a `request` adapter.
 */
export async function assertHqContract(
  options: HqContractTestOptions
): Promise<void> {
  // 1. unauthenticated request is rejected
  const anonymous = await options.request({ method: "GET", path: "/internal/hq/manifest" });
  assert(anonymous.status === 401, `manifest without auth must be 401, got ${anonymous.status}`);

  // 2. manifest is valid and versioned
  const manifestResponse = await options.request(
    signed(options, { method: "GET", path: "/internal/hq/manifest" })
  );
  assert(manifestResponse.status === 200, `manifest must be 200, got ${manifestResponse.status}`);
  const manifest = hqManifestSchema.parse(manifestResponse.body);
  assert(manifest.schemaVersion.startsWith("1."), "manifest schemaVersion must be 1.x");
  assert(manifest.product.slug === options.config.product.slug, "manifest slug mismatch");

  // 3. health is derived and valid
  const healthResponse = await options.request(
    signed(options, { method: "GET", path: "/internal/hq/health" })
  );
  assert(healthResponse.status === 200, `health must be 200, got ${healthResponse.status}`);
  const health = hqHealthSchema.parse(healthResponse.body);
  assert(
    health.status === deriveHealthStatus(health.checks),
    "health status must be derived from checks"
  );

  // 4. events page matches the canonical envelope
  if (options.config.capabilities.includes("events") && options.config.listEvents) {
    const eventsResponse = await options.request(
      signed(options, { method: "GET", path: "/internal/hq/events?limit=10" })
    );
    assert(eventsResponse.status === 200, `events must be 200, got ${eventsResponse.status}`);
    eventsPageSchema.parse(eventsResponse.body);
  }

  // 5. lookup returns 404, never a 500, for unknown ids
  if (options.config.capabilities.includes("lookup")) {
    const lookups = [
      options.config.getCustomer ? "/internal/hq/customers/contract-test-missing" : null,
      options.config.getOrder ? "/internal/hq/orders/contract-test-missing" : null,
      options.config.getPayment ? "/internal/hq/payments/contract-test-missing" : null,
    ].filter((path): path is string => path !== null);

    for (const path of lookups) {
      const response = await options.request(signed(options, { method: "GET", path }));
      assert(response.status !== 500, `${path} must not 500 for a missing id`);
      assert(response.status === 404, `${path} must be 404 for a missing id`);
    }
  }

  // 6. signature is required even for health
  const unsignedHealth = await options.request({ method: "GET", path: "/internal/hq/health" });
  assert(unsignedHealth.status === 401, `health without auth must be 401, got ${unsignedHealth.status}`);
}
