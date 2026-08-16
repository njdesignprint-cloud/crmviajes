import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { sessionIdentity } from "./saas-auth";

export type AuthenticatedUser = {
  email: string;
  displayName: string;
};

const EMAIL_HEADER = "oai-authenticated-user-email";
const CLOUDFLARE_ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";
const NAME_HEADER = "oai-authenticated-user-full-name";
const NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";

export async function authenticatedUser(): Promise<AuthenticatedUser | null> {
  const requestHeaders = await headers();
  const email = (requestHeaders.get(EMAIL_HEADER) ?? requestHeaders.get(CLOUDFLARE_ACCESS_EMAIL_HEADER))?.trim().toLowerCase();
  if (!email) return null;

  const encodedName = requestHeaders.get(NAME_HEADER);
  let displayName = email;
  if (
    encodedName &&
    requestHeaders.get(NAME_ENCODING_HEADER) === "percent-encoded-utf-8"
  ) {
    try {
      displayName = decodeURIComponent(encodedName);
    } catch {
      // A malformed optional display name must not invalidate a valid identity.
    }
  }
  return { email, displayName };
}

export async function requireApiUser(): Promise<
  AuthenticatedUser | NextResponse
> {
  const user = await authenticatedUser();
  if (user) return user;
  return NextResponse.json(
    { error: "Debes iniciar sesión para acceder al CRM." },
    { status: 401 },
  );
}

export function isAuthError(
  value: AuthenticatedUser | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}

export type AgencyContext = AuthenticatedUser & {
  agencyId: number;
  role: "owner" | "admin" | "agent" | "viewer";
};

export async function requireAgencyContext(): Promise<AgencyContext | NextResponse> {
  const session = await sessionIdentity();
  if (session) {
    const expired = session.agencyStatus === "trial" && session.trialEndsAt && session.trialEndsAt <= new Date().toISOString();
    if (session.agencyStatus === "suspended" || session.agencyStatus === "expired" || expired)
      return NextResponse.json({ error: "Tu prueba terminó o la cuenta está suspendida. Visita Mi cuenta para elegir un plan." }, { status: 402 });
    return { email: session.email, displayName: session.displayName, agencyId: session.agencyId, role: session.role };
  }
  const identity = await requireApiUser();
  if (isAuthError(identity)) return identity;

  const member = await env.DB.prepare(
    "SELECT agency_id, role FROM agency_members WHERE email = ? AND active = 1 LIMIT 1",
  ).bind(identity.email).first<{ agency_id: number; role: AgencyContext["role"] }>();

  if (member) return { ...identity, agencyId: member.agency_id, role: member.role };

  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM agency_members",
  ).first<{ total: number }>();
  if (!count?.total) {
    const today = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO agency_members (agency_id,email,display_name,role,active,created_at) VALUES (1,?,?,\'owner\',1,?)",
    ).bind(identity.email, identity.displayName, today).run();
    return { ...identity, agencyId: 1, role: "owner" };
  }

  return NextResponse.json(
    { error: "Tu cuenta no está autorizada para esta agencia." },
    { status: 403 },
  );
}
