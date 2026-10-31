import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Canonical HQ request authentication.
 *
 * Every product<->HQ call (product -> HQ authz, HQ -> product manifest/events/
 * lookup) uses this exact scheme. There is no second implementation.
 */

export const HQ_AUTH_HEADERS = {
  clientId: "x-hq-client-id",
  timestamp: "x-hq-timestamp",
  nonce: "x-hq-nonce",
  signature: "x-hq-signature",
  version: "x-hq-version",
} as const;

export const HQ_AUTH_VERSION = "1";
export const HQ_AUTH_MAX_SKEW_MS = 5 * 60 * 1000;
export const HQ_AUTH_NONCE_TTL_MS = 10 * 60 * 1000;

export type HqAuthFailureCode =
  | "hq.unauthorized"
  | "hq.invalid_signature"
  | "hq.replay"
  | "hq.invalid_request";
const AUTH_FAILURE_STATUS: Record<HqAuthFailureCode, number> = {
  "hq.unauthorized": 401,
  "hq.invalid_signature": 403,
  "hq.replay": 409,
  "hq.invalid_request": 400,
};

export type HqAuthResult =
  | { ok: true; clientId: string }
  | { ok: false; code: HqAuthFailureCode; status: number; message: string };

export interface HeaderSource {
  get(name: string): string | null | undefined;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildCanonicalString(params: {
  method: string;
  pathWithQuery: string;
  timestamp: string;
  nonce: string;
  rawBody?: string | null;
}): string {
  return [
    params.method.toUpperCase(),
    params.pathWithQuery,
    params.timestamp,
    params.nonce,
    sha256Hex(params.rawBody ?? ""),
  ].join("\n");
}

export function hmacHex(secret: string, canonical: string): string {
  return createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
}

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
export function signHqRequest(input: SignHqRequestInput): Record<string, string> {
  const timestamp = String(input.timestamp ?? Date.now());
  const nonce = input.nonce ?? crypto.randomUUID();
  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null,
  });
  return {
    [HQ_AUTH_HEADERS.clientId]: input.clientId,
    [HQ_AUTH_HEADERS.timestamp]: timestamp,
    [HQ_AUTH_HEADERS.nonce]: nonce,
    [HQ_AUTH_HEADERS.version]: HQ_AUTH_VERSION,
    [HQ_AUTH_HEADERS.signature]: hmacHex(input.secret, canonical),
  };
}

export interface NonceStore {
  /**
   * Returns true when the nonce was unused and is now recorded. Returns false
   * when it was already used (replay).
   */
  consume(nonce: string, expiresAtMs: number): Promise<boolean>;
}

/** In-memory nonce store for tests and single-process dev. */
export function createMemoryNonceStore(now: () => number = Date.now): NonceStore {
  const seen = new Map<string, number>();
  return {
    async consume(nonce, expiresAtMs) {
      const current = now();
      for (const [key, expiry] of seen) {
        if (expiry <= current) seen.delete(key);
      }
      if (seen.has(nonce)) return false;
      seen.set(nonce, expiresAtMs);
      return true;
    },
  };
}

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

function readHeader(headers: HeaderSource, name: string): string | null {
  const value = headers.get(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Verify an incoming HQ-signed request. The caller resolves the secret for the
 * presented client id; `null` means unknown/inactive client.
 */
export async function verifyHqRequest(
  input: VerifyHqRequestInput
): Promise<HqAuthResult> {
  const clientId = readHeader(input.headers, HQ_AUTH_HEADERS.clientId);
  const timestamp = readHeader(input.headers, HQ_AUTH_HEADERS.timestamp);
  const nonce = readHeader(input.headers, HQ_AUTH_HEADERS.nonce);
  const signature = readHeader(input.headers, HQ_AUTH_HEADERS.signature);
  const version = readHeader(input.headers, HQ_AUTH_HEADERS.version);

  if (!clientId || !timestamp || !nonce || !signature) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Missing HQ auth headers",
    };
  }
  if (version && version !== HQ_AUTH_VERSION) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unsupported HQ auth version",
    };
  }

  const parsedTimestamp = Number(timestamp);
  const now = input.now ?? Date.now();
  const maxSkew = input.maxSkewMs ?? HQ_AUTH_MAX_SKEW_MS;
  if (!Number.isFinite(parsedTimestamp) || Math.abs(now - parsedTimestamp) > maxSkew) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Timestamp outside allowed skew",
    };
  }

  if (!input.secret) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unknown or inactive client",
    };
  }

  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null,
  });
  const expected = hmacHex(input.secret, canonical);

  const provided = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  if (
    provided.length !== wanted.length ||
    !timingSafeEqual(provided, wanted)
  ) {
    return {
      ok: false,
      code: "hq.invalid_signature",
      status: AUTH_FAILURE_STATUS["hq.invalid_signature"],
      message: "Invalid signature",
    };
  }

  if (input.nonceStore) {
    const accepted = await input.nonceStore.consume(
      nonce,
      parsedTimestamp + HQ_AUTH_NONCE_TTL_MS
    );
    if (!accepted) {
      return {
        ok: false,
        code: "hq.replay",
        status: AUTH_FAILURE_STATUS["hq.replay"],
        message: "Nonce already used",
      };
    }
  }

  return { ok: true, clientId };
}

export function authFailureBody(code: HqAuthFailureCode): {
  error: { code: HqAuthFailureCode; message: string };
} {
  return { error: { code, message: code } };
}
