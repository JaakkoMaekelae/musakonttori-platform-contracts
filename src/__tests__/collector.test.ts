import { describe, expect, it } from "vitest";

import {
  cursorPageSchema,
  errorGroupSchema,
  incidentSchema,
  liveSnapshotSchema,
  overviewSchema,
} from "../collector";

const NOW = "2026-10-31T12:00:00.000Z";

const group = {
  id: "grp_1",
  service: "soundlaunch",
  environment: "production",
  fingerprint: "fp",
  title: "TypeError",
  message: "boom",
  category: "application",
  errorType: "TypeError",
  errorCode: null,
  severity: "error",
  status: "open",
  operation: null,
  provider: null,
  firstSeenAt: NOW,
  lastSeenAt: NOW,
  occurrenceCount: 3,
  affectedUserCount: 1,
  firstDeploymentId: null,
  lastDeploymentId: null,
  isRegression: false,
  regressionCount: 0,
  assignedTo: null,
  assignedTeam: null,
  internalNote: null,
  resolvedAt: null,
  ignoredAt: null,
  acknowledgedAt: null,
  returnedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
};

describe("collector contract schemas", () => {
  it("accepts the collector list wrapper", () => {
    const page = cursorPageSchema(errorGroupSchema);
    expect(page.parse({ items: [group], nextCursor: null, limit: 50 })).toBeTruthy();
    expect(page.safeParse([group]).success).toBe(false);
  });

  it("accepts the overview shape with services as a number", () => {
    expect(
      overviewSchema.parse({
        generatedAt: NOW,
        services: 6,
        openIncidents: 0,
        totalGroups: 1,
        errorGroups: { recent: 1, open: 1, critical: 0 },
        recentAlertEvents: [],
        recentDeployments: [],
        recentHealthSnapshots: [],
        recentGroups: [group],
      })
    ).toBeTruthy();
  });

  it("accepts the live snapshot shape", () => {
    expect(
      liveSnapshotSchema.parse({
        generatedAt: NOW,
        degraded: { redis: false, db: false },
        services: [],
        spikes: [],
        cooldowns: [],
        unknown: [],
      })
    ).toBeTruthy();
  });

  it("accepts an incident with affectedServices", () => {
    expect(
      incidentSchema.parse({
        id: "inc_1",
        title: "Outage",
        severity: "critical",
        status: "open",
        startedAt: NOW,
        detectedAt: NOW,
        acknowledgedAt: null,
        resolvedAt: null,
        affectedServices: ["soundlaunch"],
        affectedMarkets: [],
        summary: null,
        suspectedDeploymentId: null,
        createdBy: "hq",
        acknowledgedBy: null,
        resolvedBy: null,
        createdAt: NOW,
        updatedAt: NOW,
      })
    ).toBeTruthy();
  });
});
