import type { HqConfig } from "./config";
import { dispatchHqRequest, type HqCoreResponse } from "./core";

export interface HqRouteHandlers {
  GET(request: Request): Promise<Response>;
  POST(request: Request): Promise<Response>;
}

function toResponse(result: HqCoreResponse): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readBody(request: Request): Promise<string> {
  try {
    return await request.text();
  } catch {
    return "";
  }
}

/**
 * Next.js App Router adapter.
 *
 * Mount as `app/internal/hq/[[...path]]/route.ts`:
 *
 *   export const { GET, POST } = createHqRoutes(config);
 */
export function createHqRoutes(config: HqConfig): HqRouteHandlers {
  async function dispatch(request: Request, method: "GET" | "POST"): Promise<Response> {
    const rawBody = method === "GET" ? "" : await readBody(request);
    const result = await dispatchHqRequest(config, {
      method,
      url: request.url,
      headers: request.headers,
      rawBody,
    });
    return toResponse(result);
  }

  return {
    GET: (request) => dispatch(request, "GET"),
    POST: (request) => dispatch(request, "POST"),
  };
}
