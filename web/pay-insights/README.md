# PAY Insights

Read-only ops reports. A single server-side rendered Nuxt app:

- `app/` — pages and layout (uses the `@sbc-connect/nuxt-base` header, footer and theme).
- `server/routes/auth/` — Keycloak login (authorization code + PKCE), callback and logout.
- `server/middleware/auth.ts` — every page and `/api` route needs a signed-in user with one of
  `NUXT_ALLOWED_ROLES`. Pages redirect to login; `/api` returns 401 / 403.
- `server/api/` — data routes. Pages call them with `useFetch`.
- `server/utils/warehouse.ts` — read-only session and a statement timeout. Use
  `warehouseQuery(sql, params)` with `$1, $2, ...` placeholders only.

This app runs as a Node server (`.output/server/index.mjs`), not as static files on Firebase.

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The app runs at http://localhost:3002. You need:

- A Keycloak client id (public client, PKCE) with `http://localhost:3002/auth/callback`
  as a valid redirect URI.
- `NUXT_SESSION_PASSWORD` — at least 32 random characters.
- For the warehouse, start `cloud-sql-proxy` and fill in the local `NUXT_WAREHOUSE_*` values.

In GCP, set `NUXT_WAREHOUSE_INSTANCE_CONNECTION_NAME` and `NUXT_WAREHOUSE_IAM_USER` instead — the
Cloud SQL connector uses IAM auth with the service's own identity, so no password or keyfile is needed.

## Adding a report

1. Add a definition in `server/reports/<id>.ts` with `defineReport` — title, filters, SQL and columns.
   See `server/reports/service-fees.ts`.
2. Register it in `server/reports/index.ts`.

The home page, report page (`/reports/<id>`), filters, totals, table and CSV export
(`/api/v1/reports/<id>/export.csv`) come from the definition. In the SQL:

- Use named parameters: `:paymentMethod`. A `fiscalYear` filter provides `:fiscalYear`,
  `:fiscalYearStart` and `:fiscalYearEnd` (UTC, matching how PAY stores dates).
- Cast parameters that can be NULL, e.g. `(:paymentMethod::text IS NULL OR ...)`.
- Aggregate in SQL and don't add `LIMIT`.
