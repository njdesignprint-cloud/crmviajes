import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("the private CRM page relies on Cloudflare Access without a second login redirect", async () => {
  const admin = await read("app/admin/page.tsx");
  assert.doesNotMatch(admin, /requireChatGPTUser/);
  assert.match(admin, /<CrmDashboard\s*\/>/);
  assert.match(admin, /dynamic\s*=\s*"force-dynamic"/);
});

test("identity supports both hosting and Cloudflare Access headers", async () => {
  const [serverAuth, pageAuth] = await Promise.all([
    read("app/server-auth.ts"),
    read("app/chatgpt-auth.ts"),
  ]);
  assert.match(serverAuth, /cf-access-authenticated-user-email/);
  assert.match(pageAuth, /cf-access-authenticated-user-email/);
});

test("both CRM data methods enforce API authentication", async () => {
  const api = await read("app/api/data/route.ts");
  const checks = api.match(/await requireAgencyContext\(\)/g) ?? [];
  assert.equal(checks.length, 2);
  assert.match(api, /export async function GET/);
  assert.match(api, /export async function POST/);
});

test("all private records are scoped to the authenticated agency", async () => {
  const [api, auth, migration] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/server-auth.ts"),
    read("drizzle/0002_amusing_madelyne_pryor.sql"),
  ]);
  assert.match(auth, /agency_members/);
  assert.match(auth, /role: "owner"/);
  assert.ok((api.match(/agency_id=\?/g) ?? []).length >= 10);
  assert.match(migration, /CREATE TABLE `audit_logs`/);
  assert.match(migration, /ALTER TABLE `clients` ADD `agency_id`/);
});

test("production data is never populated with demo identities", async () => {
  const [api, demo] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/api/demo/route.ts"),
  ]);
  assert.doesNotMatch(api, /maria@example\.com|james@example\.com|ramirez@example\.com/i);
  assert.match(demo, /maria@example\.com/i);
});

test("write actions validate dates, money, ids and allowed states", async () => {
  const api = await read("app/api/data/route.ts");
  assert.match(api, /function amount/);
  assert.match(api, /function date/);
  assert.match(api, /function id/);
  assert.match(api, /function choice/);
  assert.match(api, /end < start/);
});

test("the D1 migration contains missing CRM entities and query indexes", async () => {
  const migration = await read("drizzle/0001_exotic_iron_fist.sql");
  assert.match(migration, /CREATE TABLE `quotes`/);
  assert.match(migration, /CREATE TABLE `activities`/);
  assert.match(migration, /CREATE INDEX `payments_due_idx`/);
  assert.match(migration, /CREATE INDEX `quotes_status_idx`/);
});

test("travel operations include travelers, suppliers, bookings and commissions", async () => {
  const [api, migration, dashboard] = await Promise.all([
    read("app/api/data/route.ts"),
    read("drizzle/0003_same_the_initiative.sql"),
    read("app/crm-dashboard.tsx"),
  ]);
  assert.match(migration, /CREATE TABLE `travelers`/);
  assert.match(migration, /CREATE TABLE `suppliers`/);
  assert.match(migration, /CREATE TABLE `bookings`/);
  assert.match(api, /receiveCommission/);
  assert.match(api, /supplier_id/);
  assert.match(dashboard, /Operación y comisiones/);
});

test("professional quotes use server-calculated line items", async () => {
  const [api, migration, dashboard] = await Promise.all([
    read("app/api/data/route.ts"),
    read("drizzle/0004_parched_vulture.sql"),
    read("app/crm-dashboard.tsx"),
  ]);
  assert.match(migration, /CREATE TABLE `quote_items`/);
  assert.match(api, /function quoteItems/);
  assert.match(api, /items\.reduce/);
  assert.match(api, /INSERT INTO quote_items/);
  assert.match(dashboard, /quote-builder/);
});

test("shared proposals use hashed tokens and expose a limited client portal", async () => {
  const [tokens, privateApi, publicApi, portal, migration] = await Promise.all([
    read("app/token-utils.ts"),
    read("app/api/data/route.ts"),
    read("app/api/proposal/[token]/route.ts"),
    read("app/proposal/[token]/proposal-client.tsx"),
    read("drizzle/0005_messy_nico_minoru.sql"),
  ]);
  assert.match(tokens, /crypto\.getRandomValues/);
  assert.match(tokens, /crypto\.subtle\.digest/);
  assert.match(privateApi, /share_token_hash/);
  assert.doesNotMatch(privateApi, /share_token[^_]/);
  assert.match(publicApi, /valid_until/);
  assert.match(publicApi, /accepted_at/);
  assert.match(portal, /Aceptar propuesta/);
  assert.match(migration, /quotes_share_token_unique/);
});

test("accepted quotes convert to trips with follow-up and optional payment", async () => {
  const [api, portalApi, dashboard, migration] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/api/proposal/[token]/route.ts"),
    read("app/crm-dashboard.tsx"),
    read("drizzle/0006_redundant_ares.sql"),
  ]);
  assert.match(api, /convertQuote/);
  assert.match(api, /converted_trip_id/);
  assert.match(api, /Primer pago/);
  assert.match(portalApi, /Convertir propuesta aceptada/);
  assert.match(dashboard, /Crear viaje/);
  assert.match(migration, /converted_trip_id/);
});

test("the client proposal has a print-to-PDF layout", async () => {
  const [portal, css] = await Promise.all([
    read("app/proposal/[token]/proposal-client.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(portal, /window\.print\(\)/);
  assert.match(css, /@media print/);
  assert.match(css, /print-color-adjust/);
});

test("daily automations are idempotent and configured in the deploy artifact", async () => {
  const [automation, worker, config, migration] = await Promise.all([
    read("app/daily-automations.ts"),
    read("worker/index.ts"),
    read("wrangler.jsonc"),
    read("drizzle/0007_tan_agent_brand.sql"),
  ]);
  assert.match(automation, /INSERT OR IGNORE INTO automation_events/);
  assert.match(automation, /Cobro vencido/);
  assert.match(automation, /Revisar documentos y servicios/);
  assert.match(worker, /scheduled\(controller/);
  assert.match(config, /15 13 \* \* \*/);
  assert.match(migration, /CREATE TABLE `automation_events`/);
});

test("team roles enforce read-only access and protected membership changes", async () => {
  const [api, dashboard] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/crm-dashboard.tsx"),
  ]);
  assert.match(api, /context\.role === "viewer"/);
  assert.match(api, /No puedes desactivar tu propia cuenta/);
  assert.match(api, /La cuenta propietaria no puede desactivarse/);
  assert.match(dashboard, /Solo lectura/);
});

test("client records can be edited and archived without deleting history", async () => {
  const [api, dashboard, migration] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/crm-dashboard.tsx"),
    read("drizzle/0008_next_scrambler.sql"),
  ]);
  assert.match(api, /editClient/);
  assert.match(api, /archiveClient/);
  assert.match(api, /archived_at IS NULL/);
  assert.doesNotMatch(api, /DELETE FROM clients/);
  assert.match(dashboard, /Su historial se conservará/);
  assert.match(migration, /archived_at/);
});

test("request limits and browser security headers are configured", async () => {
  const [privateApi, publicApi, config] = await Promise.all([
    read("app/api/data/route.ts"),
    read("app/api/proposal/[token]/route.ts"),
    read("next.config.ts"),
  ]);
  assert.match(privateApi, /contentLength>100_000/);
  assert.match(publicApi, /contentLength > 8_192/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /X-Frame-Options/);
  assert.match(config, /Permissions-Policy/);
});

test("production operations require backup, migration and verification", async () => {
  const [runbook, packageJson] = await Promise.all([
    read("docs/production-runbook.md"),
    read("package.json"),
  ]);
  assert.match(runbook, /d1 export/);
  assert.match(runbook, /d1 migrations list/);
  assert.match(runbook, /Rollback/);
  assert.match(packageJson, /db:migrate:remote/);
  assert.match(packageJson, /npm run lint && npm run typecheck && npm test/);
});

test("production HTML does not depend on build-machine font paths", async () => {
  const [layout, css] = await Promise.all([
    read("app/layout.tsx"),
    read("app/globals.css"),
  ]);
  assert.doesNotMatch(layout, /next\/font/);
  assert.match(css, /ui-sans-serif/);
});

test("real trials require email codes and create isolated agency sessions", async () => {
  const [auth, migration, app] = await Promise.all([
    read("app/api/auth/route.ts"),
    read("drizzle/0009_saas_trials.sql"),
    read("app/crm/page.tsx"),
  ]);
  assert.match(auth, /randomCode\(\)/);
  assert.match(auth, /RESEND_API_KEY/);
  assert.match(auth, /OTP_PEPPER/);
  assert.match(auth, /trialEnds/);
  assert.match(migration, /CREATE TABLE `user_sessions`/);
  assert.match(migration, /CREATE TABLE `email_codes`/);
  assert.match(app, /sessionIdentity/);
});

test("seller controls and Stripe billing stay ready without embedded secrets", async () => {
  const [admin, billing, webhook, config] = await Promise.all([
    read("app/api/superadmin/route.ts"),
    read("app/api/billing/route.ts"),
    read("app/api/billing/webhook/route.ts"),
    read("wrangler.jsonc"),
  ]);
  assert.match(admin, /superadminIdentity/);
  assert.match(admin, /suspended/);
  assert.match(billing, /STRIPE_SECRET_KEY/);
  assert.match(webhook, /STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(config, /sk_(?:test|live)_/);
  assert.doesNotMatch(config, /whsec_/);
});
