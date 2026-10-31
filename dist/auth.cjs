"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/auth.ts
var auth_exports = {};
__export(auth_exports, {
  HQ_AUTH_HEADERS: () => HQ_AUTH_HEADERS,
  HQ_AUTH_MAX_SKEW_MS: () => HQ_AUTH_MAX_SKEW_MS,
  HQ_AUTH_NONCE_TTL_MS: () => HQ_AUTH_NONCE_TTL_MS,
  HQ_AUTH_VERSION: () => HQ_AUTH_VERSION,
  authFailureBody: () => authFailureBody,
  buildCanonicalString: () => buildCanonicalString,
  createMemoryNonceStore: () => createMemoryNonceStore,
  hmacHex: () => hmacHex,
  sha256Hex: () => sha256Hex,
  signHqRequest: () => signHqRequest,
  verifyHqRequest: () => verifyHqRequest
});
module.exports = __toCommonJS(auth_exports);
var import_node_crypto = require("crypto");
var HQ_AUTH_HEADERS = {
  clientId: "x-hq-client-id",
  timestamp: "x-hq-timestamp",
  nonce: "x-hq-nonce",
  signature: "x-hq-signature",
  version: "x-hq-version"
};
var HQ_AUTH_VERSION = "1";
var HQ_AUTH_MAX_SKEW_MS = 5 * 60 * 1e3;
var HQ_AUTH_NONCE_TTL_MS = 10 * 60 * 1e3;
var AUTH_FAILURE_STATUS = {
  "hq.unauthorized": 401,
  "hq.invalid_signature": 403,
  "hq.replay": 409,
  "hq.invalid_request": 400
};
function sha256Hex(input) {
  return (0, import_node_crypto.createHash)("sha256").update(input, "utf8").digest("hex");
}
function buildCanonicalString(params) {
  return [
    params.method.toUpperCase(),
    params.pathWithQuery,
    params.timestamp,
    params.nonce,
    sha256Hex(params.rawBody ?? "")
  ].join("\n");
}
function hmacHex(secret, canonical) {
  return (0, import_node_crypto.createHmac)("sha256", secret).update(canonical, "utf8").digest("hex");
}
function signHqRequest(input) {
  const timestamp = String(input.timestamp ?? Date.now());
  const nonce = input.nonce ?? crypto.randomUUID();
  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null
  });
  return {
    [HQ_AUTH_HEADERS.clientId]: input.clientId,
    [HQ_AUTH_HEADERS.timestamp]: timestamp,
    [HQ_AUTH_HEADERS.nonce]: nonce,
    [HQ_AUTH_HEADERS.version]: HQ_AUTH_VERSION,
    [HQ_AUTH_HEADERS.signature]: hmacHex(input.secret, canonical)
  };
}
function createMemoryNonceStore(now = Date.now) {
  const seen = /* @__PURE__ */ new Map();
  return {
    async consume(nonce, expiresAtMs) {
      const current = now();
      for (const [key, expiry] of seen) {
        if (expiry <= current) seen.delete(key);
      }
      if (seen.has(nonce)) return false;
      seen.set(nonce, expiresAtMs);
      return true;
    }
  };
}
function readHeader(headers, name) {
  const value = headers.get(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}
async function verifyHqRequest(input) {
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
      message: "Missing HQ auth headers"
    };
  }
  if (version && version !== HQ_AUTH_VERSION) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unsupported HQ auth version"
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
      message: "Timestamp outside allowed skew"
    };
  }
  if (!input.secret) {
    return {
      ok: false,
      code: "hq.unauthorized",
      status: AUTH_FAILURE_STATUS["hq.unauthorized"],
      message: "Unknown or inactive client"
    };
  }
  const canonical = buildCanonicalString({
    method: input.method,
    pathWithQuery: input.pathWithQuery,
    timestamp,
    nonce,
    rawBody: input.rawBody ?? null
  });
  const expected = hmacHex(input.secret, canonical);
  const provided = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  if (provided.length !== wanted.length || !(0, import_node_crypto.timingSafeEqual)(provided, wanted)) {
    return {
      ok: false,
      code: "hq.invalid_signature",
      status: AUTH_FAILURE_STATUS["hq.invalid_signature"],
      message: "Invalid signature"
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
        message: "Nonce already used"
      };
    }
  }
  return { ok: true, clientId };
}
function authFailureBody(code) {
  return { error: { code, message: code } };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HQ_AUTH_HEADERS,
  HQ_AUTH_MAX_SKEW_MS,
  HQ_AUTH_NONCE_TTL_MS,
  HQ_AUTH_VERSION,
  authFailureBody,
  buildCanonicalString,
  createMemoryNonceStore,
  hmacHex,
  sha256Hex,
  signHqRequest,
  verifyHqRequest
});
//# sourceMappingURL=auth.cjs.map