import { type AdminFeaturesManifest, type CustomerDto, type HqCapability, type HqCheckStatus, type HqEnvironment, type HqEvent, type HqEventName, type HqHealth, type HqManifest, type HqManifestEndpoints, type OrderDto, type PaymentDto, type SupportContext, type SupportContextInput } from "../index";
export declare const HQ_CONTRACT_VERSION = "1.0.0";
export interface HqEventsQuery {
    cursor?: string;
    limit: number;
    since?: string;
}
export interface HqEventsPageData {
    data: HqEvent[];
    nextCursor: string | null;
    hasMore: boolean;
}
export interface HqHealthData {
    version: string;
    checks: Record<string, HqCheckStatus>;
}
export interface HqProductIdentity {
    name: string;
    slug: string;
    environment: HqEnvironment;
}
/**
 * The only per-service integration file. Everything else is shared.
 */
export interface HqConfig {
    product: HqProductIdentity;
    capabilities: HqCapability[];
    eventTypes: HqEventName[];
    endpoints?: Partial<HqManifestEndpoints>;
    limits?: {
        defaultLimit?: number;
        maxLimit?: number;
    };
    /** Resolve the shared secret for a client id (api_keys.id). */
    getClientSecret(clientId: string): Promise<string | null> | string | null;
    /** Optional replay protection. Shared implementations are provided. */
    consumeNonce?(nonce: string, expiresAtMs: number): Promise<boolean>;
    listEvents?(query: HqEventsQuery): Promise<HqEventsPageData>;
    health(): Promise<HqHealthData>;
    getCustomer?(id: string): Promise<CustomerDto | null>;
    getOrder?(id: string): Promise<OrderDto | null>;
    getPayment?(id: string): Promise<PaymentDto | null>;
    getAdminFeatures?(): Promise<AdminFeaturesManifest>;
    getSupportContext?(input: SupportContextInput): Promise<SupportContext>;
    onError?(error: unknown, context: {
        path: string;
        method: string;
    }): void;
}
export declare const DEFAULT_LIMITS: {
    defaultLimit: number;
    maxLimit: number;
};
export declare function createHqConfig(config: HqConfig): HqConfig;
export declare function buildManifest(config: HqConfig): HqManifest;
export declare function buildHealth(config: HqConfig, data: HqHealthData): HqHealth;
