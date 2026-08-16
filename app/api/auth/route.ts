import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { clearSessionCookie, randomCode, randomToken, sessionCookie, sha256 } from "../../saas-auth";

export const dynamic = "force-dynamic";
type Input = Record<string, unknown>;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function string(input: Input, key: string, max: number) {
  const value = typeof input[key] === "string" ? input[key].trim() : "";
  if (!value || value.length > max) throw new Error(`Revisa el campo ${key}.`);
  return value;
}

async function validateTurnstile(token: unknown, ip: string | null) {
  const secret = (env as { TURNSTILE_SECRET_KEY?: string }).TURNSTILE_SECRET_KEY;
  if (!secret) return;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: typeof token === "string" ? token : "", remoteip: ip }),
  });
  const result = await response.json() as { success?: boolean };
  if (!result.success) throw new Error("No pudimos validar que eres una persona. Intenta nuevamente.");
}

async function sendCode(email: string, code: string) {
  const config = env as { RESEND_API_KEY?: string; EMAIL_FROM?: string };
  if (!config.RESEND_API_KEY || !config.EMAIL_FROM)
    throw new Error("El envío de códigos todavía no está configurado por el administrador.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.RESEND_API_KEY}`, "content-type": "application/json", "user-agent": "TravelClientPro/1.0", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ from: config.EMAIL_FROM, to: [email], subject: "Tu código de acceso a TravelClientPro", html: `<div style="font-family:Arial;padding:24px"><h2>Confirma tu correo</h2><p>Tu código es:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>Vence en 10 minutos. Si no solicitaste esta prueba, ignora el mensaje.</p></div>` }),
  });
  if (!response.ok) throw new Error("No pudimos enviar el código. Verifica el correo e intenta nuevamente.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Input;
    const action = string(body, "action", 30);
    if (action === "login-code") {
      const email = string(body, "email", 254).toLowerCase();
      if (!emailPattern.test(email)) throw new Error("Escribe un correo electrónico válido.");
      const member = await env.DB.prepare("SELECT id FROM agency_members WHERE email=? AND active=1 LIMIT 1").bind(email).first();
      if (!member) throw new Error("No encontramos una cuenta activa con ese correo.");
      const code=randomCode(); const pepper=(env as {OTP_PEPPER?:string}).OTP_PEPPER;
      if(!pepper) throw new Error("La verificación de correo todavía no está configurada por el administrador.");
      await sendCode(email,code); const now=new Date();
      await env.DB.prepare("INSERT INTO email_codes (email,code_hash,purpose,payload_json,expires_at,created_at) VALUES (?,?, 'login','{}',?,?)").bind(email,await sha256(`${email}:${code}:${pepper}`),new Date(now.getTime()+10*60_000).toISOString(),now.toISOString()).run();
      return NextResponse.json({ok:true,email});
    }
    if (action === "verify-login") {
      const email=string(body,"email",254).toLowerCase(),code=string(body,"code",6),now=new Date();
      const record=await env.DB.prepare("SELECT id,code_hash,attempts,expires_at FROM email_codes WHERE email=? AND purpose='login' AND consumed_at IS NULL ORDER BY id DESC LIMIT 1").bind(email).first<{id:number;code_hash:string;attempts:number;expires_at:string}>();
      if(!record||record.expires_at<=now.toISOString()||record.attempts>=5)throw new Error("El código venció. Solicita uno nuevo.");
      const pepper=(env as {OTP_PEPPER?:string}).OTP_PEPPER||""; if(await sha256(`${email}:${code}:${pepper}`)!==record.code_hash){await env.DB.prepare("UPDATE email_codes SET attempts=attempts+1 WHERE id=?").bind(record.id).run();throw new Error("El código no es correcto.");}
      const member=await env.DB.prepare("SELECT id FROM agency_members WHERE email=? AND active=1 LIMIT 1").bind(email).first<{id:number}>();if(!member)throw new Error("Cuenta no disponible.");
      const token=randomToken();await env.DB.batch([env.DB.prepare("INSERT INTO user_sessions (member_id,token_hash,expires_at,last_seen_at,created_at) VALUES (?,?,?,?,?)").bind(member.id,await sha256(token),new Date(now.getTime()+14*24*60*60_000).toISOString(),now.toISOString(),now.toISOString()),env.DB.prepare("UPDATE email_codes SET consumed_at=? WHERE id=?").bind(now.toISOString(),record.id)]);
      return NextResponse.json({ok:true,redirect:"/crm/"},{headers:{"set-cookie":sessionCookie(token)}});
    }
    if (action === "request-code") {
      const email = string(body, "email", 254).toLowerCase();
      if (!emailPattern.test(email)) throw new Error("Escribe un correo electrónico válido.");
      const name = string(body, "name", 120);
      const agencyName = string(body, "agencyName", 120);
      const phone = string(body, "phone", 40);
      await validateTurnstile(body.turnstileToken, request.headers.get("cf-connecting-ip"));
      const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
      const recent = await env.DB.prepare("SELECT COUNT(*) total FROM email_codes WHERE email=? AND created_at>?").bind(email, cutoff).first<{total:number}>();
      if ((recent?.total || 0) >= 3) return NextResponse.json({ error: "Espera 15 minutos antes de solicitar otro código." }, { status: 429 });
      const existing = await env.DB.prepare("SELECT 1 ok FROM agency_members WHERE email=? LIMIT 1").bind(email).first();
      if (existing) throw new Error("Ese correo ya tiene una cuenta. Usa Entrar a mi cuenta.");
      const code = randomCode();
      const pepper = (env as { OTP_PEPPER?: string }).OTP_PEPPER;
      if (!pepper) throw new Error("La verificación de correo todavía no está configurada por el administrador.");
      await sendCode(email, code);
      const now = new Date();
      await env.DB.prepare("INSERT INTO email_codes (email,code_hash,purpose,payload_json,expires_at,created_at) VALUES (?,?,?,?,?,?)")
        .bind(email, await sha256(`${email}:${code}:${pepper}`), "signup", JSON.stringify({ name, agencyName, phone }), new Date(now.getTime() + 10 * 60_000).toISOString(), now.toISOString()).run();
      return NextResponse.json({ ok: true, email });
    }
    if (action === "verify-code") {
      const email = string(body, "email", 254).toLowerCase();
      const code = string(body, "code", 6);
      if (!/^\d{6}$/.test(code)) throw new Error("El código debe tener 6 números.");
      const record = await env.DB.prepare("SELECT id,code_hash,payload_json,attempts,expires_at FROM email_codes WHERE email=? AND purpose='signup' AND consumed_at IS NULL ORDER BY id DESC LIMIT 1").bind(email).first<{id:number;code_hash:string;payload_json:string;attempts:number;expires_at:string}>();
      if (!record || record.expires_at <= new Date().toISOString() || record.attempts >= 5) throw new Error("El código venció. Solicita uno nuevo.");
      const pepper = (env as { OTP_PEPPER?: string }).OTP_PEPPER || "";
      if (await sha256(`${email}:${code}:${pepper}`) !== record.code_hash) {
        await env.DB.prepare("UPDATE email_codes SET attempts=attempts+1 WHERE id=?").bind(record.id).run();
        throw new Error("El código no es correcto.");
      }
      const payload = JSON.parse(record.payload_json) as {name:string;agencyName:string;phone:string};
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60_000).toISOString();
      const agency = await env.DB.prepare("INSERT INTO agencies (name,status,trial_ends_at,plan,phone,created_at,updated_at) VALUES (?,'trial',?,'trial',?,?,?)").bind(payload.agencyName, trialEnds, payload.phone, now.toISOString(), now.toISOString()).run();
      const agencyId = Number(agency.meta.last_row_id);
      const member = await env.DB.prepare("INSERT INTO agency_members (agency_id,email,display_name,role,active,created_at) VALUES (?,?,?,'owner',1,?)").bind(agencyId,email,payload.name,now.toISOString()).run();
      const token = randomToken();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO user_sessions (member_id,token_hash,expires_at,last_seen_at,created_at) VALUES (?,?,?,?,?)").bind(Number(member.meta.last_row_id),await sha256(token),new Date(now.getTime()+14*24*60*60_000).toISOString(),now.toISOString(),now.toISOString()),
        env.DB.prepare("UPDATE email_codes SET consumed_at=? WHERE id=?").bind(now.toISOString(),record.id),
      ]);
      return NextResponse.json({ ok: true, redirect: "/crm/" }, { headers: { "set-cookie": sessionCookie(token) } });
    }
    if (action === "logout") return NextResponse.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
    throw new Error("Acción no válida.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo completar la solicitud." }, { status: 400 });
  }
}
