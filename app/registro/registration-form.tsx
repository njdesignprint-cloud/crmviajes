"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function RegistrationForm({ siteKey }: { siteKey: string }) {
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = step === "form"
      ? {
          action: "request-code",
          name: form.get("name"),
          agencyName: form.get("agencyName"),
          phone: form.get("phone"),
          email: form.get("email"),
          turnstileToken: form.get("cf-turnstile-response"),
        }
      : { action: "verify-code", email, code: form.get("code") };

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; email?: string; redirect?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo continuar.");
      if (step === "form") {
        setEmail(data.email || String(form.get("email")));
        setStep("code");
      } else {
        window.location.href = data.redirect || "/app/";
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo continuar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-shell">
        <aside className="registration-story">
          <Link className="registration-brand" href="/">
            <span>T</span>
            <div>
              <strong>TravelClientPro</strong>
              <small>TRAVEL BUSINESS PLATFORM</small>
            </div>
          </Link>
          <div className="registration-message">
            <p>PRUEBA REAL · 14 DÍAS</p>
            <h1>Convierte cada consulta en una oportunidad organizada.</h1>
            <span>
              Crea el espacio privado de tu agencia y empieza con clientes,
              cotizaciones, viajes, cobros y tareas en un solo lugar.
            </span>
          </div>
          <div className="registration-benefits">
            <span><b>01</b> Sin tarjeta de crédito</span>
            <span><b>02</b> Datos separados por agencia</span>
            <span><b>03</b> Acceso protegido por correo</span>
          </div>
          <small className="registration-location">Diseñado en Houston · Listo para agencias en todo Estados Unidos</small>
        </aside>

        <section className="registration-form-panel">
          <div className="registration-mobile-brand">
            <span>T</span><strong>TravelClientPro</strong>
          </div>
          <div className="registration-progress" aria-label="Progreso del registro">
            <span className="active">1</span><i className={step === "code" ? "active" : ""} /><span className={step === "code" ? "active" : ""}>2</span>
          </div>

          {step === "form" ? (
            <>
              <p className="registration-kicker">ABRE TU CUENTA</p>
              <h2>Crea el espacio de tu agencia</h2>
              <p className="registration-intro">
                Usa un correo real. Te enviaremos un código de seis números para confirmar tu identidad.
              </p>
              <form onSubmit={submit}>
                <div className="registration-field-row">
                  <label>Tu nombre<input name="name" autoComplete="name" required maxLength={120} placeholder="Nombre y apellido" /></label>
                  <label>Teléfono<input name="phone" autoComplete="tel" required maxLength={40} placeholder="(555) 000-0000" /></label>
                </div>
                <label>Nombre de la agencia<input name="agencyName" autoComplete="organization" required maxLength={120} placeholder="Ej. Horizon Travel" /></label>
                <label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="tu@agencia.com" /></label>
                {siteKey && <div className="registration-turnstile"><div className="cf-turnstile" data-sitekey={siteKey} /></div>}
                <button className="registration-submit" disabled={busy}>
                  {busy ? "Enviando código…" : "Continuar con mi correo"}<span>→</span>
                </button>
              </form>
            </>
          ) : (
            <div className="registration-code-step">
              <div className="registration-mail-icon">✉</div>
              <p className="registration-kicker">CONFIRMA TU CORREO</p>
              <h2>Revisa tu bandeja de entrada</h2>
              <p className="registration-intro">Enviamos un código de seis números a <strong>{email}</strong>.</p>
              <form onSubmit={submit}>
                <label>Código de confirmación<input className="registration-code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoFocus /></label>
                <button className="registration-submit" disabled={busy}>{busy ? "Verificando…" : "Confirmar y abrir mi CRM"}<span>→</span></button>
              </form>
              <button className="registration-back" onClick={() => setStep("form")}>← Cambiar correo</button>
            </div>
          )}

          {error && <div className="registration-error" role="alert">{error}</div>}
          <footer className="registration-footer">
            <span>¿Ya tienes una cuenta? <Link href="/acceso/">Entrar</Link></span>
            <Link href="/dashboard/">Explorar la demo</Link>
          </footer>
        </section>
      </section>
    </main>
  );
}
