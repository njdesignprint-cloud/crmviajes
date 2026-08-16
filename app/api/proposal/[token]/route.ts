import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { hashPublicToken, validPublicToken } from "../../../token-utils";

export const dynamic = "force-dynamic";

async function quoteForToken(token: string) {
  if (!validPublicToken(token)) return null;
  const tokenHash = await hashPublicToken(token);
  return env.DB.prepare(
    "SELECT q.id,q.agency_id,q.client_id,q.destination,q.travelers,q.subtotal,q.taxes,q.total,q.status,q.valid_until,q.notes,q.accepted_at,q.accepted_name,c.name AS client_name,a.name AS agency_name FROM quotes q JOIN clients c ON c.id=q.client_id AND c.agency_id=q.agency_id JOIN agencies a ON a.id=q.agency_id WHERE q.share_token_hash=? LIMIT 1",
  ).bind(tokenHash).first<Record<string, unknown>>();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const quote = await quoteForToken(token);
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  const items = await env.DB.prepare(
    "SELECT category,description,quantity,unit_price,total FROM quote_items WHERE quote_id=? ORDER BY sort_order,id",
  ).bind(quote.id).all();
  await env.DB.prepare(
    "UPDATE quotes SET viewed_at=COALESCE(viewed_at,?) WHERE id=?",
  ).bind(new Date().toISOString(), quote.id).run();
  return NextResponse.json({ quote, items: items.results }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192)
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  const { token } = await params;
  const quote = await quoteForToken(token);
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (String(quote.valid_until) < new Date().toISOString().slice(0, 10))
    return NextResponse.json({ error: "Esta cotización ya venció." }, { status: 409 });
  if (quote.status === "Rechazada")
    return NextResponse.json({ error: "Esta cotización ya no está disponible." }, { status: 409 });
  const body = await request.json() as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 120)
    return NextResponse.json({ error: "Escribe el nombre de quien acepta." }, { status: 400 });
  await env.DB.prepare(
    "UPDATE quotes SET status='Aceptada',accepted_at=COALESCE(accepted_at,?),accepted_name=COALESCE(accepted_name,?) WHERE id=?",
  ).bind(new Date().toISOString(), name, quote.id).run();
  if (!quote.accepted_at) {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO tasks (agency_id,client_id,title,due_date,priority,completed) VALUES (?,?,?,?,?,0)").bind(quote.agency_id,quote.client_id,`Convertir propuesta aceptada de ${quote.destination} en viaje`,tomorrow,"Alta"),
      env.DB.prepare("INSERT INTO activities (agency_id,client_id,kind,detail,created_at) VALUES (?,?,?,?,?)").bind(quote.agency_id,quote.client_id,"Cotización",`Propuesta aceptada por ${name}`,today),
    ]);
  }
  return NextResponse.json({ ok: true });
}
