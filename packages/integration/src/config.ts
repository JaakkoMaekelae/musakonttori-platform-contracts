import {
  DEFAULT_ENDPOINTS,
  deriveHealthStatus,
  hqManifestSchema,
  type AdminFeaturesManifest,
  type CustomerDto,
  type HqCapability,
  type HqCheckStatus,
  type HqEnvironment,
  type HqEvent,
  type HqEventName,
  type HqHealth,
  type HqManifest,
  type HqManifestEndpoints,
  type OrderDto,
  type PaymentDto,
  type SupportContext,
  type SupportContextInput,
} from "@musakonttori/platform-contracts";

export const HQ_CONTRACT_VERSION = "1.0.0";

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
  limits?: { defaultLimit?: number; maxLimit?: number };

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

  onError?(error: unknown, context: { path: string; method: string }): void;
}

export const DEFAULT_LIMITS = { defaultLimit: 500, maxLimit: 1000 };

export function createHqConfig(config: HqConfig): HqConfig {
  return config;
}

export function buildManifest(config: HqConfig): HqManifest {
  const capabilities = new Set(config.capabilities);
  const endpoints: HqManifestEndpoints = {
    ...DEFAULT_ENDPOINTS,
    ...config.endpoints,
  };

  if (!capabilities.has("events")) delete endpoints.events;
  if (!config.getCustomer) delete endpoints.lookupCustomer;
  if (!config.getOrder) delete endpoints.lookupOrder;
  if (!config.getPayment) delete endpoints.lookupPayment;
  if (!config.getAdminFeatures) delete endpoints.adminFeatures;
  if (!config.getSupportContext) delete endpoints.supportContext;

  return hqManifestSchema.parse({
    schemaVersion: HQ_CONTRACT_VERSION,
    product: config.product,
    capabilities: config.capabilities,
    eventTypes: config.eventTypes,
    endpoints,
    limits: { ...DEFAULT_LIMITS, ...config.limits },
    cursorType: "timestamp_id",
  });
}

export function buildHealth(config: HqConfig, data: HqHealthData): HqHealth {
  return {
    status: deriveHealthStatus(data.checks),
    product: config.product.slug,
    version: data.version,
    environment: config.product.environment,
    checks: data.checks,
    timestamp: new Date().toISOString(),
  };
}
