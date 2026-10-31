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
export type HqContractTestRequest = (input: HqContractTestRequestInput) => Promise<HqContractTestResponse>;
export interface HqContractTestOptions {
    request: HqContractTestRequest;
    config: HqConfig;
    clientId: string;
    secret: string;
}
/**
 * The identical contract suite every service runs against its own routes.
 * Framework-specific tests only provide a `request` adapter.
 */
export declare function assertHqContract(options: HqContractTestOptions): Promise<void>;
