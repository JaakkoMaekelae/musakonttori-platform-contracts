import { type HeaderSource } from "../index";
import { type HqConfig } from "./config";
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
export declare class HqIntegrationError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(status: number, code: string, message: string, details?: unknown);
}
/**
 * Framework-independent HQ request dispatcher. Both the Next adapter and the
 * Fastify adapter call this function, so behaviour cannot drift.
 */
export declare function dispatchHqRequest(config: HqConfig, request: HqCoreRequest): Promise<HqCoreResponse>;
