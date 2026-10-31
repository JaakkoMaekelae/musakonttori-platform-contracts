import { describe, expect, it } from "vitest";

import {
  createMemoryNonceStore,
  eventsPageFixture,
  manifestFixture,
  signHqRequest,
} from "../index";

import { createHqConfig } from "../integration/config";
import { createHqRoutes } from "../integration/next";
import { assertHqContract } from "../integration/testing";

const SECRET = "integration-secret";
const CLIENT_ID = "client_1";

function buildConfig() {
  const nonceStore = createMemoryNonceStore();
  return createHqConfig({
    product: manifestFixture.product,
    capabilities: manifestFixture.capabilities,
    eventTypes: manifestFixture.eventTypes,
    consumeNonce: (nonce, expiresAt) => nonceStore.consume(nonce, expiresAt),
    getClientSecret: (clientId) => (clientId === CLIENT_ID ? SECRET : null),
    listEvents: async () => ({
      data: eventsPageFixture.data,
      nextCursor: eventsPageFixture.pagination.nextCursor,
      hasMore: false,
    }),
    health: async () => ({ version: "1.0.0", checks: { database: "ok" } }),
    getCustomer: async (id) => (id === "cust_fixture_1" ? null : null),
    getOrder: async () => null,
    getPayment: async () => null,
  });
}

function signedHeaders(method: "GET" | "POST", path: string, body?: string) {
  return signHqRequest({
    method,
    pathWithQuery: path,
    clientId: CLIENT_ID,
    secret: SECRET,
    rawBody: body ?? null,
  });
}

async function request(
  handler: ReturnType<typeof createHqRoutes>,
  method: "GET" | "POST",
  path: string,
  body?: string
): Promise<{ status: number; body: unknown }> {
  const response = await (method === "GET" ? handler.GET : handler.POST)(
    new Request(`http://localhost${path}`, {
      method,
      headers: signedHeaders(method, path, body),
      ...(body ? { body } : {}),
    })
  );
  return { status: response.status, body: await response.json() };
}

describe("Next HQ adapter", () => {
  it("returns 401 without auth", async () => {
    const routes = createHqRoutes(buildConfig());
    const response = await routes.GET(
      new Request("http://localhost/internal/hq/manifest")
    );
    expect(response.status).toBe(401);
  });

  it("serves a valid manifest", async () => {
    const routes = createHqRoutes(buildConfig());
    const result = await request(routes, "GET", "/internal/hq/manifest");
    expect(result.status).toBe(200);
    expect((result.body as { schemaVersion: string }).schemaVersion).toBe("1.0.0");
  });

  it("serves the canonical events envelope", async () => {
    const routes = createHqRoutes(buildConfig());
    const result = await request(routes, "GET", "/internal/hq/events?limit=10");
    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("data");
    expect(result.body).toHaveProperty("pagination.hasMore");
  });

  it("derives health status", async () => {
    const routes = createHqRoutes(buildConfig());
    const result = await request(routes, "GET", "/internal/hq/health");
    expect(result.status).toBe(200);
    expect((result.body as { status: string }).status).toBe("healthy");
  });

  it("passes the shared contract suite", async () => {
    const config = buildConfig();
    const routes = createHqRoutes(config);
    await assertHqContract({
      config,
      clientId: CLIENT_ID,
      secret: SECRET,
      request: ({ method, path, body, headers }) =>
        (async () => {
          const response = await (method === "GET" ? routes.GET : routes.POST)(
            new Request(`http://localhost${path}`, {
              method,
              headers: headers ?? {},
              ...(body ? { body } : {}),
            })
          );
          return { status: response.status, body: await response.json() };
        })(),
    });
  });
});
