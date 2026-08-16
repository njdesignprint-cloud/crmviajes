import { env } from "cloudflare:workers";
import { RegistrationForm } from "./registration-form";

export const dynamic = "force-dynamic";
export default function Registro() {
  const siteKey = (env as { TURNSTILE_SITE_KEY?: string }).TURNSTILE_SITE_KEY || "";
  return <RegistrationForm siteKey={siteKey} />;
}
