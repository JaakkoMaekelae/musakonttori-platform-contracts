import {
  __export
} from "./chunk-PZ5AY32C.js";

// src/collector.ts
var collector_exports = {};
__export(collector_exports, {
  collectorErrorResponseSchema: () => collectorErrorResponseSchema,
  cursorPageSchema: () => cursorPageSchema,
  deploymentDetailSchema: () => deploymentDetailSchema,
  deploymentSchema: () => deploymentSchema,
  errorGroupDetailSchema: () => errorGroupDetailSchema,
  errorGroupNoteSchema: () => errorGroupNoteSchema,
  errorGroupPatchRequestSchema: () => errorGroupPatchRequestSchema,
  errorGroupPatchResponseSchema: () => errorGroupPatchResponseSchema,
  errorGroupSchema: () => errorGroupSchema,
  errorOccurrenceSchema: () => errorOccurrenceSchema,
  errorSeveritySchema: () => errorSeveritySchema,
  errorStatusSchema: () => errorStatusSchema,
  externalServiceSchema: () => externalServiceSchema,
  healthSnapshotSchema: () => healthSnapshotSchema,
  incidentCreateRequestSchema: () => incidentCreateRequestSchema,
  incidentPatchRequestSchema: () => incidentPatchRequestSchema,
  incidentResponseSchema: () => incidentResponseSchema,
  incidentSchema: () => incidentSchema,
  liveSnapshotSchema: () => liveSnapshotSchema,
  occurrenceResponseSchema: () => occurrenceResponseSchema,
  overviewSchema: () => overviewSchema,
  serviceDetailSchema: () => serviceDetailSchema,
  serviceSummarySchema: () => serviceSummarySchema,
  traceResponseSchema: () => traceResponseSchema,
  webhookDetailSchema: () => webhookDetailSchema,
  webhookExecutionSchema: () => webhookExecutionSchema
});
import { z } from "zod";
var iso = z.string().min(10).refine((value) => !Number.isNaN(Date.parse(value)), "invalid date");
var nullableIso = iso.nullable().optional();
var errorSeveritySchema = z.enum(["critical", "error", "warning", "info"]);
var errorStatusSchema = z.enum([
  "new",
  "open",
  "acknowledged",
  "resolved",
  "ignored",
  "regressed"
]);
var errorGroupSchema = z.object({
  id: z.string(),
  service: z.string(),
  environment: z.string(),
  fingerprint: z.string(),
  title: z.string(),
  message: z.string(),
  category: z.string(),
  errorType: z.string(),
  errorCode: z.string().nullable().optional(),
  severity: errorSeveritySchema,
  status: errorStatusSchema,
  operation: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  firstSeenAt: iso,
  lastSeenAt: iso,
  occurrenceCount: z.number().int().nonnegative(),
  affectedUserCount: z.number().int().nonnegative().optional(),
  firstDeploymentId: z.string().nullable().optional(),
  lastDeploymentId: z.string().nullable().optional(),
  isRegression: z.boolean().optional(),
  regressionCount: z.number().int().nonnegative().optional(),
  assignedTo: z.string().nullable().optional(),
  assignedTeam: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
  resolvedAt: nullableIso,
  ignoredAt: nullableIso,
  acknowledgedAt: nullableIso,
  returnedAt: nullableIso,
  createdAt: iso,
  updatedAt: iso
});
var errorGroupNoteSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  author: z.string(),
  body: z.string(),
  createdAt: iso
});
var errorOccurrenceSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  eventId: z.string(),
  service: z.string(),
  environment: z.string(),
  timestamp: iso,
  message: z.string(),
  stack: z.string().nullable().optional(),
  traceId: z.string().nullable().optional(),
  spanId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  operation: z.string().nullable().optional(),
  deploymentId: z.string().nullable().optional(),
  gitCommit: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  statusCode: z.number().int().nullable().optional(),
  latencyMs: z.number().int().nullable().optional(),
  category: z.string().optional(),
  severity: errorSeveritySchema.optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: iso
});
var serviceSummarySchema = z.object({
  id: z.string(),
  service: z.string(),
  displayName: z.string(),
  criticality: z.string().optional(),
  owner: z.string().nullable().optional(),
  repository: z.string().nullable().optional(),
  vercelProject: z.string().nullable().optional(),
  dependencies: z.array(z.string()).optional(),
  docsUrl: z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var deploymentSchema = z.object({
  id: z.string(),
  service: z.string(),
  providerDeploymentId: z.string().optional(),
  provider: z.string().optional(),
  environment: z.string(),
  gitCommit: z.string().nullable().optional(),
  gitBranch: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  startedAt: nullableIso,
  completedAt: nullableIso,
  status: z.string(),
  metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: errorSeveritySchema,
  status: z.string(),
  startedAt: iso,
  detectedAt: iso.optional(),
  acknowledgedAt: nullableIso,
  resolvedAt: nullableIso,
  affectedServices: z.array(z.string()).optional(),
  affectedMarkets: z.array(z.string()).optional(),
  summary: z.string().nullable().optional(),
  suspectedDeploymentId: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  acknowledgedBy: z.string().nullable().optional(),
  resolvedBy: z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var healthSnapshotSchema = z.object({
  id: z.string(),
  service: z.string(),
  environment: z.string(),
  timestamp: iso,
  requestCount: z.number().int().nonnegative().optional(),
  errorCount: z.number().int().nonnegative().optional(),
  errorRate: z.number().optional(),
  p50Latency: z.number().int().nullable().optional(),
  p95Latency: z.number().int().nullable().optional(),
  p99Latency: z.number().int().nullable().optional(),
  status: z.string(),
  createdAt: iso
});
var webhookExecutionSchema = z.object({
  id: z.string(),
  service: z.string(),
  provider: z.string(),
  eventType: z.string(),
  externalEventId: z.string().nullable().optional(),
  receivedAt: iso,
  processingStartedAt: nullableIso,
  processingCompletedAt: nullableIso,
  durationMs: z.number().int().nullable().optional(),
  status: z.string(),
  attempts: z.number().int().nonnegative().optional(),
  idempotencyResult: z.string().nullable().optional(),
  errorCode: z.string().nullable().optional(),
  traceId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  errorGroupId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: iso
});
var cursorPageSchema = (item) => z.object({
  items: z.array(item),
  nextCursor: z.string().nullable().optional(),
  limit: z.number().int().positive().optional()
});
var errorGroupDetailSchema = z.object({
  group: errorGroupSchema,
  notes: z.array(errorGroupNoteSchema),
  recentOccurrences: z.array(errorOccurrenceSchema)
});
var serviceDetailSchema = z.object({
  service: serviceSummarySchema,
  groups: z.array(errorGroupSchema),
  deployments: z.array(deploymentSchema)
});
var deploymentDetailSchema = z.object({
  deployment: deploymentSchema,
  comparison: z.object({
    newFingerprints: z.array(errorGroupSchema),
    resolvedFingerprints: z.array(errorGroupSchema),
    regressions: z.array(errorGroupSchema),
    errorRateDelta: z.number().nullable()
  })
});
var webhookDetailSchema = z.object({
  webhook: webhookExecutionSchema,
  errorGroup: errorGroupSchema.nullable()
});
var occurrenceResponseSchema = z.object({
  occurrence: errorOccurrenceSchema
});
var incidentResponseSchema = z.object({
  incident: incidentSchema
});
var errorGroupPatchResponseSchema = z.object({
  group: errorGroupSchema,
  note: errorGroupNoteSchema.nullable().optional()
});
var traceResponseSchema = z.object({
  traceId: z.string(),
  occurrenceCount: z.number().int().nonnegative(),
  occurrences: z.array(errorOccurrenceSchema),
  externalTraceUrl: z.string().nullable().optional(),
  rawTraceStored: z.boolean()
});
var externalServiceSchema = z.object({
  provider: z.string(),
  groups: z.number().int().nonnegative(),
  occurrences: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  services: z.array(z.string()),
  lastSeenAt: nullableIso
});
var overviewSchema = z.object({
  generatedAt: iso,
  services: z.number().int().nonnegative(),
  openIncidents: z.number().int().nonnegative(),
  totalGroups: z.number().int().nonnegative(),
  errorGroups: z.object({
    recent: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative()
  }),
  recentAlertEvents: z.array(z.record(z.string(), z.unknown())),
  recentDeployments: z.array(deploymentSchema),
  recentHealthSnapshots: z.array(healthSnapshotSchema),
  recentGroups: z.array(errorGroupSchema)
});
var liveSnapshotSchema = z.object({
  generatedAt: z.string().nullable(),
  degraded: z.object({ redis: z.boolean(), db: z.boolean() }),
  services: z.array(
    z.object({
      service: z.string(),
      errors1m: z.number().nullable(),
      errors5m: z.number().nullable(),
      errorsPerMin5m: z.number().nullable(),
      errorRate1m: z.number().nullable(),
      affectedUsers5m: z.number().nullable()
    })
  ),
  spikes: z.array(
    z.object({
      fingerprint: z.string(),
      service: z.string().nullable(),
      operation: z.string().nullable(),
      count1m: z.number().nullable(),
      baselinePerMin: z.number().nullable(),
      ratio: z.number().nullable()
    })
  ),
  cooldowns: z.array(
    z.object({
      ruleId: z.string(),
      until: z.string().nullable()
    })
  ),
  unknown: z.array(z.string())
});
var incidentCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  severity: errorSeveritySchema.default("critical"),
  status: z.string().default("open"),
  startedAt: iso.optional(),
  affectedServices: z.array(z.string().min(1)).default([]),
  affectedMarkets: z.array(z.string().min(1)).default([]),
  summary: z.string().max(1e4).optional(),
  suspectedDeploymentId: z.string().optional(),
  createdBy: z.string().optional()
}).strict();
var incidentPatchRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  severity: errorSeveritySchema.optional(),
  status: z.string().optional(),
  summary: z.string().max(1e4).optional(),
  acknowledgedBy: z.string().optional(),
  resolvedBy: z.string().optional()
}).strict();
var errorGroupPatchRequestSchema = z.object({
  status: errorStatusSchema.optional(),
  severity: errorSeveritySchema.optional(),
  assignedTo: z.string().nullable().optional(),
  assignedTeam: z.string().nullable().optional(),
  note: z.string().max(1e4).optional(),
  internalNote: z.string().nullable().optional()
}).strict();
var collectorErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional()
});

export {
  errorSeveritySchema,
  errorStatusSchema,
  errorGroupSchema,
  errorGroupNoteSchema,
  errorOccurrenceSchema,
  serviceSummarySchema,
  deploymentSchema,
  incidentSchema,
  healthSnapshotSchema,
  webhookExecutionSchema,
  cursorPageSchema,
  errorGroupDetailSchema,
  serviceDetailSchema,
  deploymentDetailSchema,
  webhookDetailSchema,
  occurrenceResponseSchema,
  incidentResponseSchema,
  errorGroupPatchResponseSchema,
  traceResponseSchema,
  externalServiceSchema,
  overviewSchema,
  liveSnapshotSchema,
  incidentCreateRequestSchema,
  incidentPatchRequestSchema,
  errorGroupPatchRequestSchema,
  collectorErrorResponseSchema,
  collector_exports
};
//# sourceMappingURL=chunk-UCAV2NZM.js.map