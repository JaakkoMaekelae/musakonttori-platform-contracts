import type { EventsPage, HqHealth, HqManifest } from "./product";

const NOW = "2026-10-31T12:00:00.000Z";

export const manifestFixture: HqManifest = {
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
    lookupPayment: "GET /internal/hq/payments/:id",
  },
  limits: { defaultLimit: 500, maxLimit: 1000 },
  cursorType: "timestamp_id",
};

export const eventsPageFixture: EventsPage = {
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
        updatedAt: NOW,
      },
    },
  ],
  pagination: { nextCursor: `${NOW}|evt_fixture_1`, hasMore: false },
};

export const healthFixture: HqHealth = {
  status: "healthy",
  product: "SoundLaunch",
  version: "1.0.0",
  environment: "production",
  checks: { database: "ok" },
  timestamp: NOW,
};

export const errorEventFixture = {
  eventId: "evt_error_fixture_1",
  service: "soundlaunch",
  environment: "production",
  timestamp: NOW,
  errorType: "TypeError",
  message: "Cannot read properties of undefined",
  severity: "error",
  operation: "release.publish",
  category: "application",
};

export const CUSTOMER_FIXTURE = {
  id: "cust_fixture_1",
  email: "emma@example.com",
  name: "Emma Virtanen",
  createdAt: NOW,
  updatedAt: NOW,
};

export const ORDER_FIXTURE = eventsPageFixture.data[0]!.payload;
