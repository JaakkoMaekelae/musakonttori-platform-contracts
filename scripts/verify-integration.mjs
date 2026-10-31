#!/usr/bin/env node
/**
 * Cross-service HQ integration verifier.
 *
 * Usage:
 *   HQ_TARGETS='[{"name":"soundlaunch","url":"http://localhost:3000","clientId":"...","secret":"..."}]' \
 *   node scripts/verify-integration.mjs
 *
 * Optional collector checks:
 *   COLLECTOR_URL, COLLECTOR_HQ_TOKEN          -> GET /v1/hq/groups
 *   COLLECTOR_URL, OBSERVABILITY_INGEST_KEY, SERVICE
 *                                               -> POST /v1/errors (synthetic)
 */
import { signHqRequest, hqManifestSchema, hqHealthSchema, eventsPageSchema } from "../dist/index.js";

const targets = JSON.parse(process.env.HQ_TARGETS ?? "[]");
if (targets.length === 0) {
  console.error("HQ_TARGETS is empty. Nothing to verify.");
  process.exit(2);
}

let failures = 0;
function log(ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures++;
}

async function get(target, path, expectStatus = 200) {
  const headers = signHqRequest({
    method: "GET",
    pathWithQuery: path,
    clientId: target.clientId,
    secret: target.secret,
  });
  const response = await fetch(`${target.url.replace(/\/$/, "")}${path}`, { headers });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

for (const target of targets) {
  const prefix = target.pathPrefix ?? "/internal/hq";
  try {
    const unsigned = await fetch(`${target.url.replace(/\/$/, "")}${prefix}/manifest`);
    log(unsigned.status === 401, `${target.name}: unauthenticated manifest is 401 (got ${unsigned.status})`);

    const manifest = await get(target, `${prefix}/manifest`);
    log(manifest.status === 200, `${target.name}: manifest 200 (got ${manifest.status})`);
    if (manifest.status === 200) {
      const parsed = hqManifestSchema.safeParse(manifest.body);
      log(parsed.success, `${target.name}: manifest matches contract v1`);
      if (parsed.success) {
        log(parsed.data.product.slug === target.slug, `${target.name}: manifest slug ${parsed.data.product.slug} == ${target.slug}`);
      }
    }

    const health = await get(target, `${prefix}/health`);
    const parsedHealth = hqHealthSchema.safeParse(health.body);
    log(health.status === 200 && parsedHealth.success, `${target.name}: health 200 and canonical`);
    if (parsedHealth.success) {
      log(
        ["healthy", "degraded", "down"].includes(parsedHealth.data.status),
        `${target.name}: health status ${parsedHealth.data.status}`
      );
    }

    if (target.events !== false) {
      const events = await get(target, `${prefix}/events?limit=1`);
      const parsedEvents = eventsPageSchema.safeParse(events.body);
      log(events.status === 200 && parsedEvents.success, `${target.name}: events page canonical`);
    }

    if (target.lookup !== false) {
      const missing = await get(target, `${prefix}/customers/verify-missing`, 404);
      log(missing.status === 404, `${target.name}: missing customer is 404 (got ${missing.status})`);
    }
  } catch (error) {
    log(false, `${target.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (process.env.COLLECTOR_URL && process.env.COLLECTOR_HQ_TOKEN) {
  try {
    const response = await fetch(`${process.env.COLLECTOR_URL.replace(/\/$/, "")}/v1/hq/groups?limit=1`, {
      headers: { Authorization: `Bearer ${process.env.COLLECTOR_HQ_TOKEN}` },
    });
    log(response.status === 200, `collector: HQ groups 200 (got ${response.status})`);
  } catch (error) {
    log(false, `collector: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (process.env.COLLECTOR_URL && process.env.OBSERVABILITY_INGEST_KEY) {
  try {
    const response = await fetch(`${process.env.COLLECTOR_URL.replace(/\/$/, "")}/v1/errors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OBSERVABILITY_INGEST_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: `verify_${Date.now()}`,
        service: process.env.SERVICE ?? "verify",
        environment: "test",
        timestamp: new Date().toISOString(),
        errorType: "VerificationError",
        message: "HQ integration verification event",
        severity: "info",
        category: "application",
        operation: "verify.integration",
      }),
    });
    log(response.status === 200, `collector: synthetic error accepted (got ${response.status})`);
  } catch (error) {
    log(false, `collector ingest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

process.exit(failures === 0 ? 0 : 1);
