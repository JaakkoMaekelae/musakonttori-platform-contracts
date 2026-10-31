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
module.exports = __toCommonJS(collector_exports);
var import_zod = require("zod");
var iso = import_zod.z.string().min(10).refine((value) => !Number.isNaN(Date.parse(value)), "invalid date");
var nullableIso = iso.nullable().optional();
var errorSeveritySchema = import_zod.z.enum(["critical", "error", "warning", "info"]);
var errorStatusSchema = import_zod.z.enum([
  "new",
  "open",
  "acknowledged",
  "resolved",
  "ignored",
  "regressed"
]);
var errorGroupSchema = import_zod.z.object({
  id: import_zod.z.string(),
  service: import_zod.z.string(),
  environment: import_zod.z.string(),
  fingerprint: import_zod.z.string(),
  title: import_zod.z.string(),
  message: import_zod.z.string(),
  category: import_zod.z.string(),
  errorType: import_zod.z.string(),
  errorCode: import_zod.z.string().nullable().optional(),
  severity: errorSeveritySchema,
  status: errorStatusSchema,
  operation: import_zod.z.string().nullable().optional(),
  provider: import_zod.z.string().nullable().optional(),
  firstSeenAt: iso,
  lastSeenAt: iso,
  occurrenceCount: import_zod.z.number().int().nonnegative(),
  affectedUserCount: import_zod.z.number().int().nonnegative().optional(),
  firstDeploymentId: import_zod.z.string().nullable().optional(),
  lastDeploymentId: import_zod.z.string().nullable().optional(),
  isRegression: import_zod.z.boolean().optional(),
  regressionCount: import_zod.z.number().int().nonnegative().optional(),
  assignedTo: import_zod.z.string().nullable().optional(),
  assignedTeam: import_zod.z.string().nullable().optional(),
  internalNote: import_zod.z.string().nullable().optional(),
  resolvedAt: nullableIso,
  ignoredAt: nullableIso,
  acknowledgedAt: nullableIso,
  returnedAt: nullableIso,
  createdAt: iso,
  updatedAt: iso
});
var errorGroupNoteSchema = import_zod.z.object({
  id: import_zod.z.string(),
  groupId: import_zod.z.string(),
  author: import_zod.z.string(),
  body: import_zod.z.string(),
  createdAt: iso
});
var errorOccurrenceSchema = import_zod.z.object({
  id: import_zod.z.string(),
  groupId: import_zod.z.string(),
  eventId: import_zod.z.string(),
  service: import_zod.z.string(),
  environment: import_zod.z.string(),
  timestamp: iso,
  message: import_zod.z.string(),
  stack: import_zod.z.string().nullable().optional(),
  traceId: import_zod.z.string().nullable().optional(),
  spanId: import_zod.z.string().nullable().optional(),
  requestId: import_zod.z.string().nullable().optional(),
  route: import_zod.z.string().nullable().optional(),
  method: import_zod.z.string().nullable().optional(),
  operation: import_zod.z.string().nullable().optional(),
  deploymentId: import_zod.z.string().nullable().optional(),
  gitCommit: import_zod.z.string().nullable().optional(),
  market: import_zod.z.string().nullable().optional(),
  locale: import_zod.z.string().nullable().optional(),
  userId: import_zod.z.string().nullable().optional(),
  accountId: import_zod.z.string().nullable().optional(),
  entityType: import_zod.z.string().nullable().optional(),
  entityId: import_zod.z.string().nullable().optional(),
  provider: import_zod.z.string().nullable().optional(),
  statusCode: import_zod.z.number().int().nullable().optional(),
  latencyMs: import_zod.z.number().int().nullable().optional(),
  category: import_zod.z.string().optional(),
  severity: errorSeveritySchema.optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).nullable().optional(),
  createdAt: iso
});
var serviceSummarySchema = import_zod.z.object({
  id: import_zod.z.string(),
  service: import_zod.z.string(),
  displayName: import_zod.z.string(),
  criticality: import_zod.z.string().optional(),
  owner: import_zod.z.string().nullable().optional(),
  repository: import_zod.z.string().nullable().optional(),
  vercelProject: import_zod.z.string().nullable().optional(),
  dependencies: import_zod.z.array(import_zod.z.string()).optional(),
  docsUrl: import_zod.z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var deploymentSchema = import_zod.z.object({
  id: import_zod.z.string(),
  service: import_zod.z.string(),
  providerDeploymentId: import_zod.z.string().optional(),
  provider: import_zod.z.string().optional(),
  environment: import_zod.z.string(),
  gitCommit: import_zod.z.string().nullable().optional(),
  gitBranch: import_zod.z.string().nullable().optional(),
  version: import_zod.z.string().nullable().optional(),
  startedAt: nullableIso,
  completedAt: nullableIso,
  status: import_zod.z.string(),
  metrics: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).nullable().optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var incidentSchema = import_zod.z.object({
  id: import_zod.z.string(),
  title: import_zod.z.string(),
  severity: errorSeveritySchema,
  status: import_zod.z.string(),
  startedAt: iso,
  detectedAt: iso.optional(),
  acknowledgedAt: nullableIso,
  resolvedAt: nullableIso,
  affectedServices: import_zod.z.array(import_zod.z.string()).optional(),
  affectedMarkets: import_zod.z.array(import_zod.z.string()).optional(),
  summary: import_zod.z.string().nullable().optional(),
  suspectedDeploymentId: import_zod.z.string().nullable().optional(),
  createdBy: import_zod.z.string().nullable().optional(),
  acknowledgedBy: import_zod.z.string().nullable().optional(),
  resolvedBy: import_zod.z.string().nullable().optional(),
  createdAt: iso,
  updatedAt: iso
});
var healthSnapshotSchema = import_zod.z.object({
  id: import_zod.z.string(),
  service: import_zod.z.string(),
  environment: import_zod.z.string(),
  timestamp: iso,
  requestCount: import_zod.z.number().int().nonnegative().optional(),
  errorCount: import_zod.z.number().int().nonnegative().optional(),
  errorRate: import_zod.z.number().optional(),
  p50Latency: import_zod.z.number().int().nullable().optional(),
  p95Latency: import_zod.z.number().int().nullable().optional(),
  p99Latency: import_zod.z.number().int().nullable().optional(),
  status: import_zod.z.string(),
  createdAt: iso
});
var webhookExecutionSchema = import_zod.z.object({
  id: import_zod.z.string(),
  service: import_zod.z.string(),
  provider: import_zod.z.string(),
  eventType: import_zod.z.string(),
  externalEventId: import_zod.z.string().nullable().optional(),
  receivedAt: iso,
  processingStartedAt: nullableIso,
  processingCompletedAt: nullableIso,
  durationMs: import_zod.z.number().int().nullable().optional(),
  status: import_zod.z.string(),
  attempts: import_zod.z.number().int().nonnegative().optional(),
  idempotencyResult: import_zod.z.string().nullable().optional(),
  errorCode: import_zod.z.string().nullable().optional(),
  traceId: import_zod.z.string().nullable().optional(),
  requestId: import_zod.z.string().nullable().optional(),
  errorGroupId: import_zod.z.string().nullable().optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).nullable().optional(),
  createdAt: iso
});
var cursorPageSchema = (item) => import_zod.z.object({
  items: import_zod.z.array(item),
  nextCursor: import_zod.z.string().nullable().optional(),
  limit: import_zod.z.number().int().positive().optional()
});
var errorGroupDetailSchema = import_zod.z.object({
  group: errorGroupSchema,
  notes: import_zod.z.array(errorGroupNoteSchema),
  recentOccurrences: import_zod.z.array(errorOccurrenceSchema)
});
var serviceDetailSchema = import_zod.z.object({
  service: serviceSummarySchema,
  groups: import_zod.z.array(errorGroupSchema),
  deployments: import_zod.z.array(deploymentSchema)
});
var deploymentDetailSchema = import_zod.z.object({
  deployment: deploymentSchema,
  comparison: import_zod.z.object({
    newFingerprints: import_zod.z.array(errorGroupSchema),
    resolvedFingerprints: import_zod.z.array(errorGroupSchema),
    regressions: import_zod.z.array(errorGroupSchema),
    errorRateDelta: import_zod.z.number().nullable()
  })
});
var webhookDetailSchema = import_zod.z.object({
  webhook: webhookExecutionSchema,
  errorGroup: errorGroupSchema.nullable()
});
var occurrenceResponseSchema = import_zod.z.object({
  occurrence: errorOccurrenceSchema
});
var incidentResponseSchema = import_zod.z.object({
  incident: incidentSchema
});
var errorGroupPatchResponseSchema = import_zod.z.object({
  group: errorGroupSchema,
  note: errorGroupNoteSchema.nullable().optional()
});
var traceResponseSchema = import_zod.z.object({
  traceId: import_zod.z.string(),
  occurrenceCount: import_zod.z.number().int().nonnegative(),
  occurrences: import_zod.z.array(errorOccurrenceSchema),
  externalTraceUrl: import_zod.z.string().nullable().optional(),
  rawTraceStored: import_zod.z.boolean()
});
var externalServiceSchema = import_zod.z.object({
  provider: import_zod.z.string(),
  groups: import_zod.z.number().int().nonnegative(),
  occurrences: import_zod.z.number().int().nonnegative(),
  critical: import_zod.z.number().int().nonnegative(),
  services: import_zod.z.array(import_zod.z.string()),
  lastSeenAt: nullableIso
});
var overviewSchema = import_zod.z.object({
  generatedAt: iso,
  services: import_zod.z.number().int().nonnegative(),
  openIncidents: import_zod.z.number().int().nonnegative(),
  totalGroups: import_zod.z.number().int().nonnegative(),
  errorGroups: import_zod.z.object({
    recent: import_zod.z.number().int().nonnegative(),
    open: import_zod.z.number().int().nonnegative(),
    critical: import_zod.z.number().int().nonnegative()
  }),
  recentAlertEvents: import_zod.z.array(import_zod.z.record(import_zod.z.string(), import_zod.z.unknown())),
  recentDeployments: import_zod.z.array(deploymentSchema),
  recentHealthSnapshots: import_zod.z.array(healthSnapshotSchema),
  recentGroups: import_zod.z.array(errorGroupSchema)
});
var liveSnapshotSchema = import_zod.z.object({
  generatedAt: import_zod.z.string().nullable(),
  degraded: import_zod.z.object({ redis: import_zod.z.boolean(), db: import_zod.z.boolean() }),
  services: import_zod.z.array(
    import_zod.z.object({
      service: import_zod.z.string(),
      errors1m: import_zod.z.number().nullable(),
      errors5m: import_zod.z.number().nullable(),
      errorsPerMin5m: import_zod.z.number().nullable(),
      errorRate1m: import_zod.z.number().nullable(),
      affectedUsers5m: import_zod.z.number().nullable()
    })
  ),
  spikes: import_zod.z.array(
    import_zod.z.object({
      fingerprint: import_zod.z.string(),
      service: import_zod.z.string().nullable(),
      operation: import_zod.z.string().nullable(),
      count1m: import_zod.z.number().nullable(),
      baselinePerMin: import_zod.z.number().nullable(),
      ratio: import_zod.z.number().nullable()
    })
  ),
  cooldowns: import_zod.z.array(
    import_zod.z.object({
      ruleId: import_zod.z.string(),
      until: import_zod.z.string().nullable()
    })
  ),
  unknown: import_zod.z.array(import_zod.z.string())
});
var incidentCreateRequestSchema = import_zod.z.object({
  title: import_zod.z.string().min(1).max(200),
  severity: errorSeveritySchema.default("critical"),
  status: import_zod.z.string().default("open"),
  startedAt: iso.optional(),
  affectedServices: import_zod.z.array(import_zod.z.string().min(1)).default([]),
  affectedMarkets: import_zod.z.array(import_zod.z.string().min(1)).default([]),
  summary: import_zod.z.string().max(1e4).optional(),
  suspectedDeploymentId: import_zod.z.string().optional(),
  createdBy: import_zod.z.string().optional()
}).strict();
var incidentPatchRequestSchema = import_zod.z.object({
  title: import_zod.z.string().min(1).max(200).optional(),
  severity: errorSeveritySchema.optional(),
  status: import_zod.z.string().optional(),
  summary: import_zod.z.string().max(1e4).optional(),
  acknowledgedBy: import_zod.z.string().optional(),
  resolvedBy: import_zod.z.string().optional()
}).strict();
var errorGroupPatchRequestSchema = import_zod.z.object({
  status: errorStatusSchema.optional(),
  severity: errorSeveritySchema.optional(),
  assignedTo: import_zod.z.string().nullable().optional(),
  assignedTeam: import_zod.z.string().nullable().optional(),
  note: import_zod.z.string().max(1e4).optional(),
  internalNote: import_zod.z.string().nullable().optional()
}).strict();
var collectorErrorResponseSchema = import_zod.z.object({
  error: import_zod.z.string(),
  message: import_zod.z.string(),
  details: import_zod.z.unknown().optional()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectorErrorResponseSchema,
  cursorPageSchema,
  deploymentDetailSchema,
  deploymentSchema,
  errorGroupDetailSchema,
  errorGroupNoteSchema,
  errorGroupPatchRequestSchema,
  errorGroupPatchResponseSchema,
  errorGroupSchema,
  errorOccurrenceSchema,
  errorSeveritySchema,
  errorStatusSchema,
  externalServiceSchema,
  healthSnapshotSchema,
  incidentCreateRequestSchema,
  incidentPatchRequestSchema,
  incidentResponseSchema,
  incidentSchema,
  liveSnapshotSchema,
  occurrenceResponseSchema,
  overviewSchema,
  serviceDetailSchema,
  serviceSummarySchema,
  traceResponseSchema,
  webhookDetailSchema,
  webhookExecutionSchema
});
//# sourceMappingURL=collector.cjs.map