# Dealer Desk — Server

A production backend for the Dealer Desk frontend (`src/api/*.ts`), built with
Express, TypeScript, and MySQL via Prisma.

## 1. Architecture

```
React Frontend (src/)
      down: axios (src/api/client.ts)
Express Routes (src/routes)
      down
Auth middleware (src/common/middleware/authenticate.ts)
      down
Permission middleware (src/common/middleware/authorize.ts)
      down
Controller (thin - parses req, calls service, formats response)
      down
Service (business logic, transactions, status machines)
      down
Repository (Prisma queries only)
      down
MySQL (via Prisma)
```

Every module under `src/modules/<name>/` follows:
`*.routes.ts` -> `*.controller.ts` -> `*.service.ts` -> `*.repository.ts`,
plus `*.mapper.ts` (DB row to frontend DTO) and `*.validation.ts` (Zod schemas).

## 2. Installation

```bash
cd server
npm install
cp .env.example .env   # then fill in real secrets + DATABASE_URL
```

## 3. Database setup (MySQL)

### One-shot bootstrap (recommended)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-db.ps1
```

Idempotent — safe to re-run any time. On a machine with nothing set up yet it
will: initialize a MySQL data directory, start `mysqld`, create the
`dealer_desk` database and `dealerdesk` user, apply every Prisma migration,
and seed development data. On a machine that already has all of this, every
step just verifies and no-ops.

This is written for this project's actual dev setup on Windows: MySQL
installed via `winget install Oracle.MySQL` **without admin rights**, so it
can't run as a real Windows service — it runs standalone, started on demand
(see `scripts/start-mysql.ps1`, wired into `predev` in `package.json` so
`npm run dev` always brings it up first). If you're on a machine with MySQL
already running as a normal service, skip the script and do the manual
steps below instead.

### Manual steps (any MySQL install)

```bash
# Create the database + app user (adjust host/user/pass for your setup)
mysql -u root -p -e "
  CREATE DATABASE dealer_desk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'dealerdesk'@'localhost' IDENTIFIED BY 'dealerdesk';
  GRANT ALL PRIVILEGES ON dealer_desk.* TO 'dealerdesk'@'localhost';
"

# Apply the schema (all committed migrations, no prompts)
npx prisma migrate deploy

# Seed development master data + a dev admin account
npm run seed
```

Development login after seeding: `admin@dealer.com` / `ChangeMe123!`
**Change this password immediately outside of local development — never
seed this account against a database anyone else can reach.**

## 4. Development

```bash
npm run dev          # tsx watch, auto-restarts on change
npm run typecheck    # tsc --noEmit
npm run build        # compiles to dist/
npm start            # runs the compiled build
```

> **A note on `npx prisma generate`:** it downloads a query-engine binary
> from `binaries.prisma.sh`. If you're running this in a network-restricted
> sandbox, that download will be blocked — it works normally on a regular
> dev machine or CI runner with standard internet access. Run it once
> after `npm install` and again any time `prisma/schema.prisma` changes.

## 5. Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:port/db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Must be long, random, and different from each other |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `ERP_BASE_URL` / `ERP_API_KEY` | Optional — leave blank to run with ERP push queued-but-unsent |

## 6. Authentication

- `POST /auth/login` — validates credentials, locks the account after
  `MAX_FAILED_LOGIN_ATTEMPTS`, returns a short-lived JWT access token in the
  response body and a **rotating refresh token in an httpOnly cookie**.
- `POST /auth/refresh` — reads the refresh cookie, verifies it's active and
  unexpired, revokes it, and issues a new access token + new refresh cookie
  (rotation — a replayed old refresh token is rejected).
- `POST /auth/logout` / `/auth/logout-all` — revoke one or all refresh
  tokens for the account.
- `GET /auth/me` — returns the current staff member + resolved permissions.
- `POST /auth/change-password` — requires the current password, revokes all
  existing sessions afterward.

**Required one-line frontend change:** `src/api/client.ts`'s axios instance
does not currently set `withCredentials: true`. Since the refresh token is
delivered as an httpOnly cookie (safer than storing it in JS-accessible
state), the browser needs `withCredentials: true` on the axios instance for
that cookie to be sent/received across the API boundary. This is the only
frontend file this backend requires changing, and only that one line.

## 7. Roles & permissions

Permissions are plain strings like `dealers.edit`, `requests.assign`,
checked server-side via `requirePermission(...)` — never trust anything the
client sends about its own permissions. Roles are seeded in
`prisma/seed.ts` (`admin`, `field_staff`) — extend via the `roles` /
`permissions` / `role_permissions` / `staff_roles` tables, or add an admin
UI on top of `GET /setup/roles`.

## 8. Database indexes

Defined directly in `prisma/schema.prisma`: dealer code (unique), request
status/priority/dueAt/scheduledAt, visit scheduledAt/status, staff email
(unique), timeline `(entity_type, entity_id)`, audit log `(entity_type,
entity_id)`, notification `(staff_id, is_read)`.

## 9. File storage

Not yet implemented as a full module — `UPLOAD_DIR` / `UPLOAD_MAX_SIZE_MB`
are reserved in `.env.example` for when document upload endpoints are
added (dealer documents, request/visit attachments). See section 16, "Known gaps".

## 10. ERP integration

`POST /requests/:id/push` marks the request `erp_sync_status = pending`
and records a timeline event. There's no ERP-specific client wired up yet
— the `integrations/erp/` abstraction described in the original brief
(interface + service + client + retry/webhook handling) is a deliberate
gap; see section 16.

## 11. Sync

`POST /sync/batch` accepts `{ mutations: [{ client_uuid, op_type, payload }] }`,
supports `request.create`, `visit.create`, `visit.outcome`, `request.note`,
and is idempotent via the `sync_mutations` table keyed on `client_uuid` — a
repeated mutation UUID is a no-op, not a duplicate record.
`GET /sync/changes?since=<ISO date>` returns everything updated since.

## 12. Testing

```bash
npm test
```

Two real integration suites are included (`tests/auth.test.ts`,
`tests/dealers.test.ts`) that run against an actual MySQL database (point
`DATABASE_URL` at a disposable test database — no mocked Prisma client).
They establish the pattern; the exhaustive per-module matrix described in
the original brief is not fully built out — see section 16.

## 13. Deployment

```bash
docker compose up --build
```

Builds the API image (multi-stage: install, prisma generate, tsc build,
slim runtime image) and a MySQL 8.4 container. Set `JWT_ACCESS_SECRET` /
`JWT_REFRESH_SECRET` in your shell or an `.env` file next to
`docker-compose.yml` before running — the compose file refuses to start
without them.

For a managed MySQL host instead, just point `DATABASE_URL` at it and run
`npx prisma migrate deploy` as part of your deploy step.

## 14. Security checklist

- [x] Passwords hashed with bcrypt (`BCRYPT_SALT_ROUNDS`, default 12)
- [x] JWT access tokens short-lived (15m default); refresh tokens rotate and are stored hashed (SHA-256), never in plaintext
- [x] Account lockout after repeated failed logins
- [x] Helmet, CORS allow-list, rate limiting (global + stricter on `/auth/*`)
- [x] Zod validation on every mutating endpoint; unknown/malformed input never reaches a service
- [x] Centralized error handler — no stack traces or internals leak in production
- [x] Structured logging with secrets/tokens redacted
- [x] Audit log on sensitive mutations (login, conversion, etc. — extend `writeAuditLog` calls as needed)
- [ ] Full file-upload hardening (MIME/extension/size checks) — not yet implemented, see section 16
- [ ] CSRF protection for cookie-based refresh flow — recommended before production (double-submit token or SameSite=strict tightening)

## 15. API endpoint summary

```
/api/v1/auth              login, refresh, logout, logout-all, me, change-password
/api/v1/bootstrap          GET  (ETag/304 support)
/api/v1/dealers            GET, GET/:id, GET/:id/360, PUT/:id,
                            GET|POST /:id/contacts, GET /:id/requests,
                            GET /:id/visits, GET /:id/timeline
/api/v1/prospects          GET, POST, GET/:id, PATCH/:id, POST /:id/stage,
                            POST /:id/convert, GET|POST /:id/checklist(/:itemId),
                            GET /:id/visits, GET /:id/requests
/api/v1/requests           GET, POST, GET/:id, GET /:id/details, /lines, /timeline,
                            POST /:id/status, /assign, /priority, /reschedule,
                            /notes, /push, /revise, /handling, /details
/api/v1/visits             GET, POST, GET/:id, GET /:id/timeline,
                            POST /:id/start, /:id/outcome
/api/v1/notifications       GET, GET /unread-count, POST|PATCH /:id/read, /read-all
/api/v1/search               GET ?q=
/api/v1/sync                 POST /batch, GET /changes
/api/v1/setup                GET /territories, /tiers, /visit-types,
                            /request-types, /staff, /roles
/api/v1/my-day  /my-week  /queue  /dashboard   (mounted at API root, see routes/index.ts)
/api/v1/health, /health       status + DB check
```

## 16. Known gaps (documented, not hidden)

Built to be genuinely useful and to compile/run — not a toy. But given the
scope of the original brief, these were consciously left out rather than
faked:

- **Documents/attachments module** — schema has no `documents` table yet;
  add one plus multer-backed upload/download routes with MIME/size
  validation before relying on file attachments.
- **Full ERP client** — `integrations/erp/` interface + retry/webhook
  handling isn't built; `push` just marks status as pending.
- **Reports beyond `/dashboard`** — dedicated report endpoints (dealer
  performance, SLA reports, staff performance, etc.) aren't separately
  implemented; the aggregate queries in `dashboard.routes.ts` show the
  pattern to extend.
- **Admin CRUD for master data** — `/setup/*` is currently read-only;
  territories/tiers/request-types are managed via `prisma/seed.ts` or
  Prisma Studio (`npm run prisma:studio`), not an API yet.
- **Exhaustive test matrix** — two integration suites establish the
  pattern (real DB, real app, no mocks); the full per-module suite from
  the brief isn't built out.
- **CSRF protection** on the cookie-based refresh flow — see checklist above.

None of these are placeholder functions or fake data inside the modules
that *are* built — everything implemented talks to real MySQL through
Prisma, with real validation, real transactions, and real permission
checks.
