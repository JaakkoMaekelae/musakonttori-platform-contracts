import { describe, expect, it } from "vitest";

import {
  deriveHealthStatus,
  eventsPageSchema,
  hqManifestSchema,
  hqHealthSchema,
} from "../product";
import { eventsPageFixture, healthFixture, manifestFixture } from "../fixtures";

describe("product contract schemas", () => {
  it("accepts the canonical manifest fixture", () => {
    expect(hqManifestSchema.parse(manifestFixture)).toBeTruthy();
  });

  it("rejects a manifest missing eventTypes", () => {
    const invalid = { ...manifestFixture } as Record<string, unknown>;
    delete invalid.eventTypes;
    expect(hqManifestSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects the legacy supportedEvents key", () => {
    const invalid = {
      ...manifestFixture,
      supportedEvents: manifestFixture.eventTypes,
    } as Record<string, unknown>;
    delete invalid.eventTypes;
    expect(hqManifestSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts the canonical events page", () => {
    expect(eventsPageSchema.parse(eventsPageFixture)).toBeTruthy();
  });

  it("rejects the legacy events envelope", () => {
    const legacy = {
      events: eventsPageFixture.data,
      nextCursor: null,
      hasMore: false,
    };
    expect(eventsPageSchema.safeParse(legacy).success).toBe(false);
  });

  it("derives health status from checks", () => {
    expect(deriveHealthStatus({ database: "ok" })).toBe("healthy");
    expect(deriveHealthStatus({ database: "ok", redis: "degraded" })).toBe(
      "degraded"
    );
    expect(deriveHealthStatus({ database: "error" })).toBe("down");
    expect(hqHealthSchema.parse(healthFixture)).toBeTruthy();
  });
});
