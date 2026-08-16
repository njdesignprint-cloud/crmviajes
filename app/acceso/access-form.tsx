"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function AccessForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sent
          ? { action: "verify-login", email, code: form.get("code") }
          : { action: "login-code", email: form.get("email") }),
      });
      const data = await response.json() as { error?: string; email?: string; redirect?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo continuar.");
      if (sent) window.location.href = data.redirect || "/crm/";
      else {
        setEmail(data.email || String(form.get("email")));
        setSent(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo continuar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="registration-page access-page">
      <section className="registration-shell">
        <aside className="registration-story access-story">
          <Link className="registration-brand" href="/">
            <span>T</span>
            <div><strong>TravelClientPro</strong><small>TRAVEL BUSINESS PLATFORM</small></div>
          </Link>
          <div className="registration-message">
            <p>ACCESO SEGURO</p>
            <h1>Todo lo importante de tu agencia te espera.</h1>
            <span>Continúa donde lo dejaste: clientes, cotizaciones, viajes, cobros y tareas, protegidos en un solo espacio.</span>
          </div>
          <div className="registration-benefits">
            <span><b>01</b> Sin contraseñas que recordar</span>
            <span><b>02</b> Código temporal por correo</span>
            <span><b>03</b> Sesión privada por agencia</span>
          </div>
          <small className="registration-location">TravelClientPro · Acceso protegido</small>
        </aside>

        <section className="registration-form-panel access-form-panel">
          <div className="registration-mobile-brand"><span>T</span><strong>TravelClientPro</strong></div>
          <div className="access-lock">{sent ? "✉" : "◇"}</div>
          <p className="registration-kicker">PORTAL DE CLIENTES</p>
          <h2>{sent ? "Escribe tu código" : "Bienvenido de nuevo"}</h2>
          <p className="registration-intro">
            {sent ? <>Enviamos un código de seis números a <strong>{email}</strong>.</> : "Recibirás un código temporal en tu correo. No necesitas contraseña."}
          </p>
          <form onSubmit={submit}>
            <label>{sent ? "Código de confirmación" : "Correo electrónico"}
              <input
                className={sent ? "registration-code" : ""}
                name={sent ? "code" : "email"}
                type={sent ? "text" : "email"}
                autoComplete={sent ? "one-time-code" : "email"}
                inputMode={sent ? "numeric" : undefined}
                pattern={sent ? "[0-9]{6}" : undefined}
                maxLength={sent ? 6 : 254}
                placeholder={sent ? "000000" : "tu@agencia.com"}
                required
                autoFocus
              />
            </label>
            <button className="registration-submit" disabled={busy}>
              {busy ? "Procesando…" : sent ? "Entrar a mi cuenta" : "Enviar código de acceso"}<span>→</span>
            </button>
          </form>
          {error && <div className="registration-error" role="alert">{error}</div>}
          {sent && <button className="registration-back" onClick={() => setSent(false)}>← Usar otro correo</button>}
          <footer className="registration-footer">
            <span>¿Aún no tienes cuenta? <Link href="/registro/">Probar 14 días</Link></span>
            <Link href="/dashboard/">Explorar la demo</Link>
          </footer>
        </section>
      </section>
    </main>
  );
}
