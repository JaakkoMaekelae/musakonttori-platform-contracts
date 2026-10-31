import type { HqConfig } from "./config";
export interface HqRouteHandlers {
    GET(request: Request): Promise<Response>;
    POST(request: Request): Promise<Response>;
}
/**
 * Next.js App Router adapter.
 *
 * Mount as `app/internal/hq/[[...path]]/route.ts`:
 *
 *   export const { GET, POST } = createHqRoutes(config);
 */
export declare function createHqRoutes(config: HqConfig): HqRouteHandlers;
