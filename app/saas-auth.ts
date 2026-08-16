import { cookies, headers } from "next/headers";
import { env } from "cloudflare:workers";

export const SESSION_COOKIE = "rumbo_session";

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomCode() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(value[0] % 1_000_000).padStart(6, "0");
}

export async function sessionIdentity() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT m.email,m.display_name,m.role,m.agency_id,a.status,a.trial_ends_at,a.plan
     FROM user_sessions s
     JOIN agency_members m ON m.id=s.member_id AND m.active=1
     JOIN agencies a ON a.id=m.agency_id
     WHERE s.token_hash=? AND s.expires_at>? LIMIT 1`,
  ).bind(tokenHash, now).first<{email:string;display_name:string;role:"owner"|"admin"|"agent"|"viewer";agency_id:number;status:string;trial_ends_at:string|null;plan:string}>();
  if (!row) return null;
  return { email: row.email, displayName: row.display_name || row.email, role: row.role, agencyId: row.agency_id, agencyStatus: row.status, trialEndsAt: row.trial_ends_at, plan: row.plan };
}

export async function superadminIdentity() {
  const requestHeaders = await headers();
  const email = (requestHeaders.get("cf-access-authenticated-user-email") ?? requestHeaders.get("oai-authenticated-user-email"))?.trim().toLowerCase();
  const configured = ((env as { SUPERADMIN_EMAIL?: string }).SUPERADMIN_EMAIL || "").trim().toLowerCase();
  return email && configured && email === configured ? email : null;
}

export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 14) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
