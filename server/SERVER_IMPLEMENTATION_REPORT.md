# Server Implementation Report

## A. Existing project analysis

`dealer-desk-web/server/` contained six empty stub files (0 bytes each,
`providers` and `services` modules only) — no working backend existed.
The real contract lives entirely in `src/api/*.ts` + `src/api/types.ts`:
an axios client with a `{message, data, meta}` envelope, bearer-token auth
with refresh, and snake_case/integer-ID domain types for dealers,
prospects, requests, visits, notifications, timeline, and a `Bootstrap`
config payload. This backend was built to match that contract exactly, so
the existing frontend requires no changes beyond the one noted in section F.

## B. Existing server code discovered

None — see A. `providers`/`services` module stubs were removed and not
rebuilt in this pass (see section W).

## C. Backend architecture

Express + TypeScript + MySQL (Prisma ORM). Layering:
routes -> controller -> service -> repository -> Prisma -> MySQL, per module,
under `src/modules/<name>/`. Shared infrastructure in `src/common/` and
`src/config/`. Full detail in `README.md` section 1.

## D. Files created

~60 files across `server/`: Prisma schema + seed, config (env/database/
logger/cors), common (errors, middleware, utils, validators), modules
(auth, bootstrap, dealers, prospects, requests, visits, notifications,
dashboard, sync, search, staff/setup), routes index, app.ts, server.ts,
tests, Dockerfile, docker-compose.yml, README.

## E. Files modified

None outside `server/` — the frontend was intentionally left untouched
except for the one documented change in section F.

## F. Frontend compatibility status

Endpoint paths, HTTP methods, request/response shapes, and the envelope
format all match `src/api/*.ts` as written. One frontend change is
required for the auth flow to work end-to-end:

- **File:** `src/api/client.ts`
- **Change:** add `withCredentials: true` to the `axios.create({...})` call.
- **Why:** the refresh token is delivered as an httpOnly cookie (safer than
  storing it in a JS-readable place). Without `withCredentials: true`,
  the browser won't send/receive that cookie cross-origin, and
  `POST /auth/refresh` will silently fail to rotate sessions.

No other frontend file needs to change.

## G. API endpoint list

See `README.md` section 15 for the full list.

## H. Database model list

`Staff, Role, Permission, RolePermission, StaffRole, RefreshToken, Tier,
Territory, VisitType, DocType, RequestType, RequestTypeField, StatusConfig,
StatusTransition, AppConfig, Sequence, Dealer, DealerContact, Prospect,
OnboardingItem, Request, RequestFieldValue, RequestLine, Visit,
TimelineEntry, Notification, AuditLog, SyncMutation` — full definitions in
`prisma/schema.prisma`.

## I. Authentication implementation

JWT access tokens (15m default) + rotating, SHA-256-hashed refresh tokens
in an httpOnly cookie; reuse of a revoked refresh token is rejected (basic
theft detection). Account lockout after `MAX_FAILED_LOGIN_ATTEMPTS` failed
logins. `bcryptjs` for password hashing. See `modules/auth/`.

## J. Permission implementation

String-keyed permissions (`dealers.edit`, `requests.assign`, ...) resolved
from `StaffRole -> Role -> RolePermission -> Permission` at login and
embedded in the access token; `requirePermission(...)` middleware enforces
server-side on every protected route. `README.md` section 7.

## K. Dealer implementation

Full CRUD-lite (list/get/update), contacts, requests, visits, timeline,
and a bonus `GET /:id/360` aggregate endpoint. `modules/dealers/`.

## L. Prospect implementation

Full lifecycle with an explicit, code-defined status machine
(`new -> contacted -> qualified -> visit_planned -> visit_completed ->
onboarding -> approved -> converted`, plus `dropped` from any non-terminal
stage). **Conversion is transactional** (`prospect.service.ts#convert`):
validates stage + duplicate dealer, creates the dealer + primary contact,
records timeline events, marks the prospect converted — all inside one
`prisma.$transaction`, rolling back completely on any failure. Repeated
conversion attempts are rejected (`convertedDealerId` is unique).

## M. Request implementation

List/create/status/assign/priority-override/reschedule/notes/push/revise/
handling/details, SLA due-date computed from the request type's
`sla_hours` at creation, `is_overdue` computed live, status transitions
validated against the `StatusTransition` table (tenant-configurable, not
hardcoded), idempotent creation via optional `client_uuid`.

## N. Visit implementation

Create/start/outcome with a status guard (can't start a non-scheduled
visit, can't submit outcome twice), idempotent creation via `client_uuid`,
outcome completion mirrors onto the linked prospect's timeline when
applicable.

## O. Calendar implementation

Not a separate backend module — the frontend's `src/api/calendar.ts`
composes `getRequests` + `getVisits` client-side with a shared date-range
param, and both `/requests` and `/visits` support `start_date`/`end_date`
filtering server-side to match. No second, conflicting event model was
introduced, per the brief's instruction.

## P. Services implementation

**Not built.** The original `services`/`providers` stub folders were
removed rather than filled with placeholder code (per "no empty
controllers/services" instruction, the honest choice was to omit rather
than fake). See section W.

## Q. Providers implementation

Not built — see P.

## R. Notification implementation

List, unread count, mark-one-read, mark-all-read (`GET/POST/PATCH`
variants for read endpoints to match either REST convention).
`modules/notifications/`.

## S. Reports implementation

`GET /dashboard` and `GET /queue` provide real aggregate metrics computed
from live data (request trend, SLA%, dealer health, territory
performance, team workload). Dedicated report endpoints beyond these two
are not separately implemented — see README section 16.

## T. Sync implementation

`POST /sync/batch` — idempotent via a `sync_mutations` table keyed on
`client_uuid`; supports `request.create`, `visit.create`, `visit.outcome`,
`request.note`. `GET /sync/changes?since=` returns changed request/visit
IDs. Full conflict-resolution semantics beyond "already applied -> skip"
are not implemented.

## U. ERP integration

`POST /requests/:id/push` marks `erp_sync_status = 'pending'` and logs a
timeline event. No live ERP client/retry/webhook abstraction — see README
section 16.

## V. Security implementation

See README section 14 (checklist). Helmet, CORS allow-list, global +
auth-specific rate limiting, Zod validation on every mutating route,
centralized error handler that never leaks internals in production,
redacted structured logging, hashed refresh tokens, bcrypt passwords,
audit log table with writes on login/creation/conversion (extendable).

## W. Tests

Two real integration suites (`tests/auth.test.ts`, `tests/dealers.test.ts`)
run against an actual MySQL database via `supertest` + the real
`createApp()` — no mocked Prisma client, per the "no mock backend"
instruction. They cover: invalid login, validation errors, successful
login + cookie behavior, unauthenticated access rejection, dealer listing
with pagination envelope, 404 handling. The exhaustive per-module matrix
described in the original brief (40+ scenarios) was not fully built out
in this pass.

## X. Remaining issues / assumptions

1. **`npx prisma generate` could not run in this environment** — the
   sandbox blocks the `binaries.prisma.sh` domain needed to download the
   query-engine binary. The Prisma client used for local development
   during this build was therefore an ungenerated stub, so `tsc --noEmit`
   could not give a 100%-clean signal on Prisma-dependent files (missing
   model/namespace types are expected until `generate` runs; two **real**
   bugs were found and fixed this way — a middleware-typing conflict in
   `app.ts` and a `jsonwebtoken` `expiresIn` typing issue in `jwt.ts`).
   **Action required on your end:** run `npm install && npx prisma
   generate` in a normal network environment before first use, and again
   after any schema change.
2. **`services`/`providers` (Service Catalogue) module** was intentionally
   left out rather than stubbed — see P/Q. Add it as its own module
   following the existing pattern when you have real catalogue data to
   seed; the brief was explicit about never fabricating fake
   services/providers.
3. **Documents/file uploads, full ERP client, admin CRUD for master data,
   and reports beyond the dashboard** are documented gaps, not silent
   omissions — see README section 16 for what's missing and why.
4. **Prospect stage machine is hardcoded** in `prospect.service.ts`
   (not DB-configurable like request statuses) — an intentional choice
   since the brief described a fixed enterprise lifecycle for prospects,
   unlike request statuses which are explicitly meant to be
   tenant-configurable via the `Bootstrap` payload.
5. **Dealer `tier_color`** — the frontend's `Dealer` type includes
   `tier_color` but the `Bootstrap` payload's `Tier` type does not. Added
   a `color` column to the `Tier` model (not exposed via `/bootstrap`,
   only via the dealer mapper) to satisfy both contracts without
   changing either frontend type.

## Y. Frontend compatibility status

See section F — fully compatible except the one documented
`withCredentials: true` addition to `src/api/client.ts`.
