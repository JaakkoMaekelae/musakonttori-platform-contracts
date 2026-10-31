import { describe, expect, it } from "vitest";

import {
  buildCanonicalString,
  createMemoryNonceStore,
  HQ_AUTH_HEADERS,
  signHqRequest,
  verifyHqRequest,
} from "../auth";

const SECRET = "test-secret";
const CLIENT_ID = "client_1";

function headerMap(headers: Record<string, string>) {
  const lower = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return { get: (name: string) => lower.get(name.toLowerCase()) ?? null };
}

describe("HQ request auth", () => {
  it("signs and verifies a request", async () => {
    const headers = signHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/manifest",
      secret: SECRET,
      clientId: CLIENT_ID,
    });

    const result = await verifyHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/manifest",
      headers: headerMap(headers),
      secret: SECRET,
    });

    expect(result).toEqual({ ok: true, clientId: CLIENT_ID });
  });

  it("includes the query string in the canonical string", () => {
    const canonical = buildCanonicalString({
      method: "GET",
      pathWithQuery: "/internal/hq/events?limit=10",
      timestamp: "1000",
      nonce: "n",
      rawBody: null,
    });
    expect(canonical).toBe(
      `GET\n/internal/hq/events?limit=10\n1000\nn\n${"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}`
    );
  });

  it("rejects a tampered body", async () => {
    const timestamp = Date.now();
    const headers = signHqRequest({
      method: "POST",
      pathWithQuery: "/internal/hq/support-context",
      secret: SECRET,
      clientId: CLIENT_ID,
      rawBody: JSON.stringify({ category: "release" }),
      timestamp,
    });

    const result = await verifyHqRequest({
      method: "POST",
      pathWithQuery: "/internal/hq/support-context",
      headers: headerMap(headers),
      secret: SECRET,
      rawBody: JSON.stringify({ category: "other" }),
      now: timestamp,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("hq.invalid_signature");
  });

  it("rejects stale timestamps", async () => {
    const timestamp = Date.now() - 10 * 60 * 1000;
    const headers = signHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/manifest",
      secret: SECRET,
      clientId: CLIENT_ID,
      timestamp,
    });

    const result = await verifyHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/manifest",
      headers: headerMap(headers),
      secret: SECRET,
      now: Date.now(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("hq.unauthorized");
  });

  it("rejects a replayed nonce", async () => {
    const nonce = "fixed-nonce";
    const timestamp = Date.now();
    const headers = signHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/health",
      secret: SECRET,
      clientId: CLIENT_ID,
      timestamp,
      nonce,
    });
    const nonceStore = createMemoryNonceStore();

    const first = await verifyHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/health",
      headers: headerMap(headers),
      secret: SECRET,
      now: timestamp,
      nonceStore,
    });
    const second = await verifyHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/health",
      headers: headerMap(headers),
      secret: SECRET,
      now: timestamp,
      nonceStore,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("hq.replay");
  });

  it("rejects a missing client id", async () => {
    const headers = signHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/health",
      secret: SECRET,
      clientId: CLIENT_ID,
    });
    delete (headers as Record<string, string>)[HQ_AUTH_HEADERS.clientId];

    const result = await verifyHqRequest({
      method: "GET",
      pathWithQuery: "/internal/hq/health",
      headers: headerMap(headers),
      secret: SECRET,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("hq.unauthorized");
  });
});
