# TravelClientPro — Production runbook

## Preflight

1. Run `npm ci` with Node.js 22.13 or newer.
2. Run `npm run check` and require a clean exit.
3. Run `npm audit --omit=dev`; production dependencies must report zero known vulnerabilities.
4. Confirm the target D1 database ID in `wrangler.jsonc`.
5. Confirm the hosting access policy covers `/admin/*` and `/api/data/*`.

## Backup and migration

Export D1 before every production migration:

```powershell
npx wrangler d1 export via-clara-crm-db --remote --output backup-before-release.sql
```

Store the export outside the repository. Inspect and apply pending migrations:

```powershell
npx wrangler d1 migrations list via-clara-crm-db --remote
npm run db:migrate:remote
```

Do not deploy code that expects new columns until migrations finish successfully.

## Deploy

```powershell
npm run deploy
```

Verify the landing page, demo, authenticated admin page, proposal portal and one read/write operation. Confirm the daily cron appears in the Worker configuration.

## First owner and team access

The first authenticated account to access the migrated CRM becomes owner of agency 1. Perform that first access with the intended owner account. Add every other account from **Equipo**. Unknown authenticated accounts receive HTTP 403.

## Rollback

Application code can use Cloudflare deployment rollback. D1 migrations are forward-only: restore the pre-release export to a new database when a schema rollback is required, validate it, then change the binding deliberately. Never overwrite production without a verified backup.

## Operations

- Review structured Worker logs for `crm_write_failed` and `daily_automations_complete`.
- Verify backups periodically by importing one into a disposable D1 database.
- Run dependency audit and the complete check suite before every release.
- Rotate proposal links when a link was sent to the wrong recipient.
