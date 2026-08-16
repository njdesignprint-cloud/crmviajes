# TravelClientPro

CRM en español para agencias de viajes: clientes, cotizaciones, viajes,
calendario de cobros, tareas, actividad comercial y reportes operativos.

Incluye cotizaciones por partidas, viajeros, proveedores, reservas y control de
comisiones, con aislamiento de datos por agencia y auditoría de escrituras.
Las propuestas pueden compartirse mediante enlaces con tokens almacenados como
hash y aceptarse desde un portal limitado para el cliente.
Una propuesta aceptada puede convertirse en viaje con fechas, primer pago,
actividad y tarea de seguimiento; el portal ofrece una salida limpia para PDF.
Un proceso diario crea recordatorios idempotentes de cobros y viajes. Los roles
de propietario, administrador, agente y solo lectura controlan el acceso del equipo.
Los expedientes de clientes pueden editarse o archivarse sin eliminar su historial.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

La aplicación corre sobre vinext y Cloudflare Workers con persistencia en D1.

## Estructura

- `app/`: producto, demo pública y API privada.
- `db/schema.ts`: esquema relacional Drizzle.
- `drizzle/`: migraciones D1 versionadas.
- `worker/`: entrada de Cloudflare Worker.
- `tests/`: contratos de seguridad y datos del CRM.

La demo pública vive en `/dashboard/`. El CRM real vive en `/admin/` y exige
identidad de Sign in with ChatGPT tanto en la página como en `/api/data`.

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run check`: lint, typecheck, build and run all CRM contract tests
- `npm run build`: verify the vinext production output
- `npm test`: build and run CRM security/data contract tests
- `npm run db:generate`: generate Drizzle migrations after schema changes
- `npm run db:migrate:local`: apply pending migrations to local D1
- `npm run db:migrate:remote`: apply pending migrations to remote D1

See `docs/production-runbook.md` before applying remote migrations or deploying.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
