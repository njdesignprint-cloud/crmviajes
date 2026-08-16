import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { superadminIdentity } from "../../saas-auth";

export const dynamic = "force-dynamic";
type AdminBody = { action?: string; agencyId?: number; days?: number; status?: string; note?: string; plan?: string; monthlyPrice?: number; billingStatus?: string; nextBillingAt?: string | null };
async function allowed() { return await superadminIdentity(); }

export async function GET() {
  const admin = await allowed();
  if (!admin) return NextResponse.json({ error: "Acceso exclusivo del propietario de la plataforma." }, { status: 403 });
  const [agencies, notes, activity] = await Promise.all([
    env.DB.prepare(`SELECT a.*,m.email AS owner_email,m.display_name AS owner_name,
      (SELECT COUNT(*) FROM clients c WHERE c.agency_id=a.id) client_count,
      (SELECT COUNT(*) FROM agency_members am WHERE am.agency_id=a.id AND am.active=1) member_count,
      (SELECT COUNT(*) FROM trips t WHERE t.agency_id=a.id) trip_count,
      (SELECT COUNT(*) FROM quotes q WHERE q.agency_id=a.id) quote_count,
      (SELECT MAX(s.last_seen_at) FROM user_sessions s JOIN agency_members sm ON sm.id=s.member_id WHERE sm.agency_id=a.id) last_access,
      COALESCE(pb.monthly_price,0) AS monthly_price,COALESCE(pb.billing_status,'not_configured') AS billing_status,
      pb.next_billing_at,pb.updated_at AS billing_updated_at
      FROM agencies a LEFT JOIN agency_members m ON m.agency_id=a.id AND m.role='owner'
      LEFT JOIN platform_billing pb ON pb.agency_id=a.id ORDER BY a.id DESC`).all(),
    env.DB.prepare("SELECT id,agency_id,author_email,note,created_at FROM sales_notes ORDER BY id DESC LIMIT 250").all(),
    env.DB.prepare("SELECT id,agency_id,actor_email,action,entity_type,created_at FROM audit_logs ORDER BY id DESC LIMIT 400").all(),
  ]);
  return NextResponse.json({ agencies: agencies.results, notes: notes.results, activity: activity.results });
}

export async function POST(request: Request) {
  const admin = await allowed();
  if (!admin) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  try {
    const body = await request.json() as AdminBody;
    const agencyId = Number(body.agencyId);
    if (!Number.isSafeInteger(agencyId) || agencyId < 1) throw new Error("Agencia inválida.");
    const now = new Date().toISOString();
    let auditAction = `superadmin:${body.action}`;
    if (body.action === "status") {
      if (!["trial", "active", "expired", "suspended"].includes(body.status || "")) throw new Error("Estado inválido.");
      await env.DB.prepare("UPDATE agencies SET status=?,updated_at=? WHERE id=?").bind(body.status, now, agencyId).run();
      auditAction += `:${body.status}`;
    } else if (body.action === "extend") {
      const days = Math.min(365, Math.max(1, Number(body.days) || 14));
      await env.DB.prepare("UPDATE agencies SET status='trial',trial_ends_at=datetime(CASE WHEN trial_ends_at>CURRENT_TIMESTAMP THEN trial_ends_at ELSE CURRENT_TIMESTAMP END, ?),updated_at=? WHERE id=?").bind(`+${days} days`, now, agencyId).run();
      auditAction += `:${days}`;
    } else if (body.action === "note") {
      const note = (body.note || "").trim();
      if (!note || note.length > 2000) throw new Error("Escribe una nota de hasta 2,000 caracteres.");
      await env.DB.prepare("INSERT INTO sales_notes (agency_id,author_email,note,created_at) VALUES (?,?,?,?)").bind(agencyId, admin, note, now).run();
    } else if (body.action === "plan") {
      const plan = (body.plan || "").trim().toLowerCase();
      if (!["trial", "starter", "professional", "enterprise"].includes(plan)) throw new Error("Plan inválido.");
      await env.DB.prepare("UPDATE agencies SET plan=?,updated_at=? WHERE id=?").bind(plan, now, agencyId).run();
      auditAction += `:${plan}`;
    } else if (body.action === "billing") {
      const price = Number(body.monthlyPrice);
      const billingStatus = body.billingStatus || "not_configured";
      if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error("Precio mensual inválido.");
      if (!["not_configured", "trial", "current", "past_due", "paused", "cancelled"].includes(billingStatus)) throw new Error("Estado de cobro inválido.");
      const nextBillingAt = body.nextBillingAt ? String(body.nextBillingAt) : null;
      await env.DB.prepare(`INSERT INTO platform_billing (agency_id,monthly_price,billing_status,next_billing_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(agency_id) DO UPDATE SET monthly_price=excluded.monthly_price,billing_status=excluded.billing_status,next_billing_at=excluded.next_billing_at,updated_at=excluded.updated_at`).bind(agencyId, price, billingStatus, nextBillingAt, now).run();
      auditAction += `:${billingStatus}`;
    } else throw new Error("Acción no válida.");
    await env.DB.prepare("INSERT INTO audit_logs (agency_id,actor_email,action,entity_type,created_at) VALUES (?,?,?,?,?)").bind(agencyId, admin, auditAction, "agency", now).run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar." }, { status: 400 });
  }
}
