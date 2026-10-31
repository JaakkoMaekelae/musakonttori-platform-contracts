/**
 * Canonical HQ request authentication.
 *
 * Every product<->HQ call (product -> HQ authz, HQ -> product manifest/events/
 * lookup) uses this exact scheme. There is no second implementation.
 */
export declare const HQ_AUTH_HEADERS: {
    readonly clientId: "x-hq-client-id";
    readonly timestamp: "x-hq-timestamp";
    readonly nonce: "x-hq-nonce";
    readonly signature: "x-hq-signature";
    readonly version: "x-hq-version";
};
export declare const HQ_AUTH_VERSION = "1";
export declare const HQ_AUTH_MAX_SKEW_MS: number;
export declare const HQ_AUTH_NONCE_TTL_MS: number;
export type HqAuthFailureCode = "hq.unauthorized" | "hq.invalid_signature" | "hq.replay" | "hq.invalid_request";
export type HqAuthResult = {
    ok: true;
    clientId: string;
} | {
    ok: false;
    code: HqAuthFailureCode;
    status: number;
    message: string;
};
export interface HeaderSource {
    get(name: string): string | null | undefined;
}
export declare function sha256Hex(input: string): string;
export declare function buildCanonicalString(params: {
    method: string;
    pathWithQuery: string;
    timestamp: string;
    nonce: string;
    rawBody?: string | null;
}): string;
export declare function hmacHex(secret: string, canonical: string): string;
export interface SignHqRequestInput {
    method: string;
    pathWithQuery: string;
    secret: string;
    rawBody?: string | null;
    timestamp?: number | string;
    nonce?: string;
    clientId: string;
}
/** Produce the four HQ auth headers for an outgoing request. */
export declare function signHqRequest(input: SignHqRequestInput): Record<string, string>;
export interface NonceStore {
    /**
     * Returns true when the nonce was unused and is now recorded. Returns false
     * when it was already used (replay).
     */
    consume(nonce: string, expiresAtMs: number): Promise<boolean>;
}
/** In-memory nonce store for tests and single-process dev. */
export declare function createMemoryNonceStore(now?: () => number): NonceStore;
export interface VerifyHqRequestInput {
    method: string;
    pathWithQuery: string;
    headers: HeaderSource;
    secret: string | null;
    rawBody?: string | null;
    now?: number;
    maxSkewMs?: number;
    nonceStore?: NonceStore;
}
/**
 * Verify an incoming HQ-signed request. The caller resolves the secret for the
 * presented client id; `null` means unknown/inactive client.
 */
export declare function verifyHqRequest(input: VerifyHqRequestInput): Promise<HqAuthResult>;
export declare function authFailureBody(code: HqAuthFailureCode): {
    error: {
        code: HqAuthFailureCode;
        message: string;
    };
};
