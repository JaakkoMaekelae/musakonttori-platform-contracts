import type { HqConfig } from "./config";
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
export type FastifyHandler = (request: FastifyRequestLike, reply: FastifyReplyLike) => Promise<void>;
export interface FastifyInstanceLike {
    get(path: string, handler: FastifyHandler): unknown;
    post(path: string, handler: FastifyHandler): unknown;
    addContentTypeParser?(contentType: string, options: {
        parseAs: "string";
    } | Record<string, unknown>, parser: (request: FastifyRequestLike, body: string, done: (error: Error | null, value?: unknown) => void) => void): unknown;
    removeContentTypeParser?(contentType: string): unknown;
}
/**
 * Fastify adapter. Register once per app:
 *
 *   await app.register(createHqFastifyPlugin(config));
 */
export declare function createHqFastifyPlugin(config: HqConfig): (app: FastifyInstanceLike) => Promise<void>;
