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

// src/fixtures.ts
var fixtures_exports = {};
__export(fixtures_exports, {
  CUSTOMER_FIXTURE: () => CUSTOMER_FIXTURE,
  ORDER_FIXTURE: () => ORDER_FIXTURE,
  errorEventFixture: () => errorEventFixture,
  eventsPageFixture: () => eventsPageFixture,
  healthFixture: () => healthFixture,
  manifestFixture: () => manifestFixture
});
module.exports = __toCommonJS(fixtures_exports);
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
  CUSTOMER_FIXTURE,
  ORDER_FIXTURE,
  errorEventFixture,
  eventsPageFixture,
  healthFixture,
  manifestFixture
});
//# sourceMappingURL=fixtures.cjs.map