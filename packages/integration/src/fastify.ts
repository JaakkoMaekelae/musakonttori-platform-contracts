import type { HqConfig } from "./config";
import { dispatchHqRequest } from "./core";

export interface FastifyRequestLike {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  rawBody?: string;
}

export interface FastifyReplyLike {
  code(status: number): FastifyReplyLike;
  send(payload?: unknown): unknown;
}

export type FastifyHandler = (
  request: FastifyRequestLike,
  reply: FastifyReplyLike
) => Promise<void>;

export interface FastifyInstanceLike {
  get(path: string, handler: FastifyHandler): unknown;
  post(path: string, handler: FastifyHandler): unknown;
  addContentTypeParser?(
    contentType: string,
    options: { parseAs: "string" } | Record<string, unknown>,
    parser: (
      request: FastifyRequestLike,
      body: string,
      done: (error: Error | null, value?: unknown) => void
    ) => void
  ): unknown;
  removeContentTypeParser?(contentType: string): unknown;
}

function headerSource(headers: FastifyRequestLike["headers"]) {
  return {
    get(name: string): string | null {
      const value = headers[name.toLowerCase()] ?? headers[name];
      if (Array.isArray(value)) return value[0] ?? null;
      return value ?? null;
    },
  };
}

function rawBodyOf(request: FastifyRequestLike): string {
  if (typeof request.rawBody === "string") return request.rawBody;
  if (request.body === undefined) return "";
  return JSON.stringify(request.body);
}

async function run(
  config: HqConfig,
  request: FastifyRequestLike,
  reply: FastifyReplyLike,
  method: "GET" | "POST"
): Promise<void> {
  const result = await dispatchHqRequest(config, {
    method,
    url: request.url,
    headers: headerSource(request.headers),
    rawBody: method === "GET" ? "" : rawBodyOf(request),
  });
  reply.code(result.status).send(result.body);
}

/**
 * Fastify adapter. Register once per app:
 *
 *   await app.register(createHqFastifyPlugin(config));
 */
export function createHqFastifyPlugin(
  config: HqConfig
): (app: FastifyInstanceLike) => Promise<void> {
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
            done(error as Error);
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
