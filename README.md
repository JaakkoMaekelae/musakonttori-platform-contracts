# musakonttori-platform-contracts

Canonical integration contracts for the Musakonttori platform.

Two packages:

- `@musakonttori/platform-contracts` — zod schemas, DTOs, HMAC signing/verifying,
  fixtures for both boundaries (product↔HQ and collector↔HQ).
- `@musakonttori/hq-integration` — the identical integration layer every service
  uses. The only per-service file is `config.ts`.

## Product usage (Next.js)

```ts
// src/lib/hq/config.ts  (the only product-specific file)
import { createHqConfig } from "@musakonttori/hq-integration";
import { db } from "@/lib/db";

export const hqConfig = createHqConfig({
  product: { name: "SoundLaunch", slug: "soundlaunch", environment: "production" },
  capabilities: ["events", "health", "lookup"],
  eventTypes: ["customer.created", "order.paid"],
  getClientSecret: async (clientId) => {
    const key = await db.hqClient.findUnique({ where: { clientId } });
    return key?.secret ?? null;
  },
  listEvents: async ({ cursor, limit, since }) => db.hqOutbox.list({ cursor, limit, since }),
  health: async () => ({ version: "1.4.2", checks: { database: "ok" } }),
  getOrder: async (id) => db.order.findHqDto(id),
});
```

```ts
// src/app/internal/hq/[[...path]]/route.ts  (identical in every service)
import { createHqRoutes } from "@musakonttori/hq-integration";
import { hqConfig } from "@/lib/hq/config";

export const { GET, POST } = createHqRoutes(hqConfig);
```

## Product usage (Fastify)

```ts
import { createHqFastifyPlugin } from "@musakonttori/hq-integration";
await app.register(createHqFastifyPlugin(hqConfig));
```

## Contract test (every service)

```ts
import { assertHqContract } from "@musakonttori/hq-integration";

await assertHqContract({ request, config: hqConfig, clientId, secret });
```

`request` is a thin adapter to the service's own test client.

## Rules

- One canonical shape. No dual parsing, no adapters, no transitional formats.
- Products own their data and their `/internal/hq/*` projection.
- HQ reads; it never writes product data.
- Breaking contract change = major version and every service updates together.
