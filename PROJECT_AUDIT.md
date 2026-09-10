# PROJECT AUDIT — Dealer Desk
**Date:** 2026-09-03  
**Auditor:** Lead Full-Stack Architect

---

## A. Current Architecture

```
dealer-desk-web/
├── src/                    # React/Vite frontend (TypeScript)
├── server/                 # Express/TypeScript backend
│   ├── prisma/             # Prisma schema (MySQL) — DEAD, must be removed
│   ├── src/
│   │   ├── models/         # Mongoose models (MongoDB) — ACTIVE
│   │   ├── modules/        # Feature modules (auth, dealers, requests, etc.)
│   │   ├── common/         # Shared middleware, utils, errors
│   │   ├── config/         # env, database, cors, logger
│   │   └── routes/         # Root router
│   └── tests/              # Vitest + Supertest tests
├── desktop/                # Legacy PHP/CodeIgniter views (reference only)
├── mobile/                 # Legacy PHP mobile views (reference only)
└── dealer_desk.sql         # Legacy MySQL dump (reference only)
```

**Runtime stack:** Node.js + Express + TypeScript + MongoDB (Mongoose)  
**Frontend:** React 18 + Vite + TypeScript + TanStack Query + Zustand + React Router v6

---

## B. Frontend Architecture

- **State:** Zustand (`authStore`, `uiStore`)
- **Server state:** TanStack Query v5 with custom hooks per module
- **Routing:** React Router v6 with protected routes
- **API client:** Single Axios instance (`src/api/client.ts`) with JWT bearer, envelope unwrap, 401 refresh
- **Mock mode:** `VITE_USE_MOCK=true` in `.env` — ALL API calls return mock data in development
- **UI:** Tailwind CSS + custom design tokens + Framer Motion + FullCalendar
- **Forms:** React Hook Form + Zod + `@hookform/resolvers`

**Frontend API modules:**
`auth`, `bootstrap`, `calendar`, `dealers`, `myDay`, `notifications`, `prospects`, `providers`, `requests`, `services`, `sync`, `visits`

---

## C. Backend Architecture

- **Framework:** Express 4 + TypeScript (Node16 module resolution)
- **Database:** MongoDB via Mongoose 9 — `connectDatabase()` in `config/database.ts`
- **Auth:** JWT access tokens (15m) + refresh token rotation (30d) via httpOnly cookie
- **Validation:** Zod schemas on all routes via `validate()` middleware
- **Error handling:** Centralized `AppError` hierarchy + `errorHandler` middleware
- **Logging:** Pino + pino-http
- **Security:** Helmet, CORS, rate limiting (express-rate-limit), bcryptjs
- **Response envelope:** `{ message, data, meta }` — unwrapped by frontend Axios interceptor

---

## D. Database Architecture

**Active:** MongoDB (Mongoose)  
**Dead:** Prisma/MySQL schema exists at `server/prisma/schema.prisma` — NOT connected

**Mongoose models defined:**
- `Staff`, `RefreshToken` (staff.model.ts)
- `Role`, `Permission`, `StaffRole` (role.model.ts)
- `Tier`, `Territory`, `VisitType`, `DocType` (master.model.ts)
- `RequestType` (requestType.model.ts)
- `StatusConfig`, `StatusTransition`, `AppConfig` (config.model.ts)
- `Sequence` (sequence.model.ts)
- `Dealer`, `DealerContact` (dealer.model.ts)
- `Prospect`, `OnboardingItem` (prospect.model.ts)
- `Request`, `RequestFieldValue`, `RequestLine` (request.model.ts)
- `Visit` (visit.model.ts)
- `TimelineEntry` (timeline.model.ts)
- `Notification` (notification.model.ts)
- `AuditLog` (audit.model.ts)
- `SyncMutation` (sync.model.ts)
- `Provider` (modules/providers/provider.repository.ts)
- `Service` (modules/services/service.repository.ts)

---

## E. Authentication Architecture

**Implemented (Mongoose):**
- `POST /api/v1/auth/login` — bcrypt verify, JWT access token, refresh token cookie
- `POST /api/v1/auth/refresh` — token rotation, new cookie
- `POST /api/v1/auth/logout` — revoke refresh token
- `POST /api/v1/auth/logout-all` — revoke all tokens for staff
- `GET /api/v1/auth/me` — return staff + permissions
- `POST /api/v1/auth/change-password`

**Features:** failed login counter, account lock, rate limiting on auth routes, httpOnly cookie for refresh token, SHA-256 hash of refresh token stored (never raw)

---

## F. Authorization Architecture

**Implemented:**
- `requirePermission(...anyOf)` middleware in `common/middleware/authorize.ts`
- Permission keys stored in JWT payload (`permissions: string[]`)
- `getStaffPermissions(staffId)` loads from `StaffRole → Role → Permission` chain
- Wildcard `*` permission for superadmin

**Permission keys used in routes:**
`dealers.view_own`, `dealers.view_all`, `dealers.edit`, `dealers.create`  
`requests.view_own`, `requests.view_all`, `requests.create`, `requests.edit`, `requests.assign`, `requests.push`  
`prospects.view_own`, `prospects.view_all`, `prospects.create`, `prospects.edit`, `prospects.convert`  
`visits.view_own`, `visits.view_all`, `visits.create`, `visits.edit`  
`users.view_all`

---

## G. API Architecture

**Prefix:** `/api/v1`  
**Mounted routers:**
- `/auth` — auth.routes.ts (Mongoose)
- `/bootstrap` — bootstrap.routes.ts ⚠️ USES PRISMA
- `/dealers` — dealer.routes.ts ⚠️ SERVICE USES PRISMA
- `/prospects` — prospect.routes.ts ⚠️ SERVICE/REPO USES PRISMA
- `/requests` — request.routes.ts ⚠️ SERVICE/REPO USES PRISMA
- `/visits` — visit.routes.ts ⚠️ SERVICE USES PRISMA
- `/notifications` — notification.routes.ts ⚠️ USES PRISMA
- `/search` — search.routes.ts ⚠️ USES PRISMA
- `/sync` — sync.routes.ts ⚠️ USES PRISMA
- `/setup` — setup.routes.ts ⚠️ USES PRISMA
- `/my-day`, `/my-week`, `/queue`, `/dashboard` — dashboard.routes.ts ⚠️ USES PRISMA

**Health check:** `GET /health` (root) + `GET /api/v1/health` ⚠️ USES `prisma.$queryRaw`

---

## H. Existing Business Modules

| Module | Models | Repository | Service | Routes | Status |
|--------|--------|-----------|---------|--------|--------|
| Auth | ✅ Mongoose | ✅ Mongoose | ✅ Mongoose | ✅ | Working |
| Bootstrap | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Dealers | ✅ Mongoose | ⚠️ Prisma | ⚠️ Prisma | ✅ | Broken |
| Dealer Contacts | ✅ Mongoose | ⚠️ Prisma | ⚠️ Prisma | ✅ | Broken |
| Prospects | ✅ Mongoose | ⚠️ Prisma | ⚠️ Prisma | ✅ | Broken |
| Requests | ✅ Mongoose | ⚠️ Prisma | ⚠️ Prisma | ✅ | Broken |
| Visits | ✅ Mongoose | ⚠️ Prisma | ⚠️ Prisma | ✅ | Broken |
| Notifications | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Dashboard/Queue | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Search | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Sync | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Setup | ✅ Mongoose | — | ⚠️ Prisma | ✅ | Broken |
| Providers | ✅ Mongoose | ✅ Mongoose | ✅ Mongoose | ✅ | Working |
| Services | ✅ Mongoose | ✅ Mongoose | ✅ Mongoose | ✅ | Working |
| Calendar | — | — | — | ❌ Missing | Missing |
| Reports | — | — | — | ❌ Missing | Missing |

---

## I. Missing Business Modules

| Module | Severity |
|--------|----------|
| Calendar API (`/calendar`) | HIGH |
| Reports API (`/reports`) | HIGH |
| Document/file upload module | HIGH |
| Seed data (no staff/roles/permissions in DB) | CRITICAL |
| Provider/Service routes not mounted in `routes/index.ts` | CRITICAL |
| `server/src/hooks/` — React hooks inside server folder | HIGH |

---

## J. Broken/Incomplete Modules

### CRITICAL

1. **`routes/index.ts` imports `prisma` from `config/database`** — `database.ts` exports only Mongoose functions, no `prisma` export. Server will crash on startup.

2. **`dealer.service.ts` imports `Prisma` from `@prisma/client`** — uses `Prisma.DealerUpdateInput`, `Prisma.DealerWhereInput`, etc. Will crash.

3. **`dealer.repository.ts`** — entirely Prisma-based (`prisma.dealer.findMany`, `prisma.request.groupBy`, etc.)

4. **`request.repository.ts`** — entirely Prisma-based

5. **`request.service.ts`** — uses `prisma.$transaction`, `prisma.requestType.findUnique`, `prisma.dealer.findUnique`, `prisma.staff.findUnique`, `prisma.statusTransition.findMany`

6. **`prospect.repository.ts`** — entirely Prisma-based

7. **`prospect.service.ts`** — uses `prisma.$transaction`, `prisma.dealer.findFirst`, `prisma.tier.findUnique`, `prisma.territory.findFirst`, `prisma.onboardingItem.*`

8. **`visit.repository.ts`** — entirely Prisma-based

9. **`visit.service.ts`** — uses `prisma.$transaction`, `prisma.dealer.findUnique`, `prisma.prospect.findUnique`

10. **`bootstrap.service.ts`** — entirely Prisma-based

11. **`dashboard.routes.ts`** — entirely Prisma-based

12. **`notification.routes.ts`** — entirely Prisma-based

13. **`search.routes.ts`** — entirely Prisma-based

14. **`sync.routes.ts`** — uses `prisma.syncMutation.*`, `prisma.request.*`, `prisma.visit.*`

15. **`setup.routes.ts`** — entirely Prisma-based

16. **`request.mapper.ts`** — imports `Request, RequestType, Staff, Dealer, RequestFieldValue, RequestLine, TimelineEntry` from `@prisma/client`

17. **`visit.mapper.ts`** — imports `Visit, VisitType, Staff, Dealer, Prospect` from `@prisma/client`

18. **`prospect.mapper.ts`** — imports `Prospect, OnboardingItem` from `@prisma/client`

19. **`routes/index.ts` health check** — uses `prisma.$queryRaw\`SELECT 1\``

20. **`nextRefNo` in `sequence.ts`** — accepts optional `tx` (Prisma transaction) parameter that is never used in Mongoose context but still typed

21. **`recordTimelineEvent` in `timeline.ts`** — accepts optional `tx` parameter (Prisma transaction) — unused in Mongoose but causes type issues

22. **`prospect.service.ts` `convert()`** — calls `nextRefNo('DLR', tx, 3)` with Prisma transaction `tx` — will fail

23. **`request.service.ts` `create()`** — calls `nextRefNo('REQ', tx)` with Prisma transaction `tx` — will fail

24. **`visit.service.ts` `create()`** — calls `nextRefNo('VIS', tx)` with Prisma transaction `tx` — will fail

### HIGH

25. **`auth.ts` (legacy)** — defines a second `StaffModel` with a different schema (includes `role` field, no `failedLoginCount`). Conflicts with `staff.model.ts`. Will cause Mongoose model re-registration error.

26. **`common/sequence/sequence.service.ts`** — defines its own `Sequence` model, duplicating `models/sequence.model.ts`. Two Mongoose models for the same collection.

27. **`common/permissions/permissions.service.ts`** — defines a completely different RBAC system (role-based matrix) that conflicts with the DB-driven permission system in `common/utils/permissions.ts` and `common/middleware/authorize.ts`.

28. **`common/sync/sync.service.ts`** — defines a different sync architecture (entity handler registry) that is never connected to `sync.routes.ts` which uses Prisma directly.

29. **`server/src/hooks/useProviders.ts` and `useServices.ts`** — React hooks inside the server folder. These are frontend files accidentally placed in the backend.

30. **Provider and Service routes not mounted** — `provider.routes.ts` and `service.routes.ts` exist but are never imported in `routes/index.ts`.

31. **`idParam` validator uses `z.coerce.number()`** — all route params expect numeric IDs, but Mongoose uses ObjectId strings. Every `Number(req.params.id)` call will produce `NaN` for MongoDB ObjectIds.

32. **`dealer.service.ts` `update()`** — uses `Prisma.DealerUpdateInput` type and `{ connect: { id: ... } }` Prisma relation syntax.

33. **`dealer.service.ts` `getOrThrow(id: number)`** — passes numeric ID to `dealerRepository.findById(id)` which calls `prisma.dealer.findUnique({ where: { id } })`.

34. **`prospect.service.ts` `convert()`** — calls `nextRefNo('DLR', tx, 3)` — `nextRefNo` signature is `(prefix, padLength)`, not `(prefix, tx, padLength)`.

### MEDIUM

35. **`server/.env.example`** — still references `DATABASE_URL` (MySQL) instead of `MONGODB_URI`.

36. **`server/package.json`** — description says "MySQL (Prisma)", still has `prisma` and `@prisma/client` as dependencies, has `prisma:*` scripts.

37. **`frontend package.json`** — has `@prisma/client` as a frontend dependency (should not be there).

38. **`frontend package.json`** — has `express-validator` as a frontend dependency (should not be there).

39. **`tests/setup.ts`** — uses `prisma.*` for test setup. Tests will fail.

40. **`tests/dealers.test.ts`** — imports `prisma` from `config/database` which doesn't export it.

41. **`server/src/modules/auth/auth.ts`** — legacy auth router that is never mounted but defines a conflicting `StaffModel`.

42. **`common/middleware/respond.ts`** — duplicate of `common/utils/response.ts`. Two response helpers.

43. **`common/utils/audit.ts`** — `entityId` typed as `string` but `AuditLogModel` schema has `entityId` as `ObjectId`.

44. **`dealer.mapper.ts`** — `DealerWithRelations` type uses `_openRequests` and `_overdueRequests` fields that must be computed by the Mongoose repository (not Prisma).

45. **`dashboard.routes.ts`** — `ownerStaffId: req.staff!.id` — staff ID is a string (ObjectId) but Prisma queries use numeric IDs.

### LOW

46. **`server/prisma/seed.ts`** — Prisma seed file, dead code.

47. **`server/prisma/schema.prisma`** — entire Prisma schema, dead code.

48. **`desktop/` and `mobile/` PHP files** — legacy reference, not served.

49. **`dealer_desk.sql`** — legacy MySQL dump, not imported.

---

## K. Duplicate Implementations

| Item | Location 1 | Location 2 | Severity |
|------|-----------|-----------|----------|
| Staff model | `models/staff.model.ts` | `modules/auth/auth.ts` | CRITICAL |
| Sequence model | `models/sequence.model.ts` | `common/sequence/sequence.service.ts` | HIGH |
| Sequence function | `common/utils/sequence.ts` | `common/sequence/sequence.service.ts` | HIGH |
| Permission system | `common/utils/permissions.ts` + `middleware/authorize.ts` | `common/permissions/permissions.service.ts` | HIGH |
| Sync service | `modules/sync/sync.routes.ts` | `common/sync/sync.service.ts` | HIGH |
| Response helper | `common/utils/response.ts` | `common/middleware/respond.ts` | MEDIUM |

---

## L. Dead Code

| File | Reason |
|------|--------|
| `server/prisma/schema.prisma` | MySQL schema, replaced by Mongoose |
| `server/prisma/seed.ts` | Prisma seed, replaced by Mongoose |
| `server/src/modules/auth/auth.ts` | Legacy auth router, never mounted, conflicts with auth.service.ts |
| `server/src/common/sequence/sequence.service.ts` | Duplicate of `common/utils/sequence.ts` |
| `server/src/common/sync/sync.service.ts` | Never connected to sync.routes.ts |
| `server/src/common/permissions/permissions.service.ts` | Replaced by DB-driven RBAC |
| `server/src/common/middleware/respond.ts` | Duplicate of `common/utils/response.ts` |
| `server/src/hooks/useProviders.ts` | React hook in server folder |
| `server/src/hooks/useServices.ts` | React hook in server folder |
| `server/src/api/providers.ts` | Frontend API client in server folder |
| `server/src/api/services.ts` | Frontend API client in server folder |

---

## M. Mock Data

| Location | Severity |
|----------|----------|
| `src/api/mockData.ts` — all mock entities | HIGH |
| `src/api/myDay.ts` — `MOCK` flag, mock data inline | HIGH |
| `src/api/auth.ts` — `MOCK` flag, `MOCK_CREDENTIALS` | HIGH |
| `src/api/dealers.ts` — needs verification | MEDIUM |
| `src/api/requests.ts` — needs verification | MEDIUM |
| `src/api/visits.ts` — `MOCK` flag | MEDIUM |
| `src/api/notifications.ts` — needs verification | MEDIUM |
| `src/api/bootstrap.ts` — needs verification | MEDIUM |
| `.env` — `VITE_USE_MOCK=true` | HIGH |

All frontend API modules check `VITE_USE_MOCK === 'true'` and return mock data instead of calling the backend. This must be disabled for production.

---

## N. Security Issues

| Issue | Severity |
|-------|----------|
| `server/.env` committed with real JWT secrets | CRITICAL |
| `server/.env.example` still references MySQL `DATABASE_URL` | HIGH |
| `frontend package.json` has `@prisma/client` (unnecessary attack surface) | MEDIUM |
| `auth.ts` legacy router defines `StaffModel` without `failedLoginCount` — bypasses brute-force protection if accidentally mounted | HIGH |
| `common/permissions/permissions.service.ts` uses role string from JWT (`req.staff.role`) — role is not in the new JWT payload (only `permissions[]`) | HIGH |
| `idParam` uses numeric coercion — passing a MongoDB ObjectId string will silently become `NaN` | HIGH |
| `dashboard.routes.ts` passes `req.staff!.id` (string) as `ownerStaffId` to Prisma queries expecting numeric IDs | HIGH |
| No seed data — no admin account exists in MongoDB, making the system inaccessible | CRITICAL |

---

## O. Data-Model Problems

| Problem | Severity |
|---------|----------|
| All Prisma models use auto-increment integer IDs; all Mongoose models use ObjectId. Frontend `types.ts` uses `number` for IDs. After migration, IDs will be strings. | CRITICAL |
| `idParam` validator coerces to `number` — incompatible with MongoDB ObjectId strings | CRITICAL |
| `request.mapper.ts` imports Prisma types — will fail to compile | CRITICAL |
| `visit.mapper.ts` imports Prisma types — will fail to compile | CRITICAL |
| `prospect.mapper.ts` imports Prisma types — will fail to compile | CRITICAL |
| `dealer.service.ts` uses `Prisma.DealerUpdateInput` — will fail to compile | CRITICAL |
| Frontend `types.ts` defines `id: number` for all entities — must change to `string` for ObjectId | HIGH |
| `TimelineEntry.entityId` is `ObjectId` in Mongoose but `number` in Prisma schema | HIGH |
| `SyncMutation.entityId` is `ObjectId` in Mongoose but `number` in Prisma schema | HIGH |

---

## P. API Contract Mismatches

| Frontend expects | Backend provides | Severity |
|-----------------|-----------------|----------|
| `id: number` on all entities | Mongoose returns `_id: ObjectId` (string) | CRITICAL |
| `GET /api/v1/bootstrap` | Exists but uses Prisma | HIGH |
| `GET /api/v1/my-day` | Exists but uses Prisma | HIGH |
| `GET /api/v1/my-week` | Exists but uses Prisma | HIGH |
| `GET /api/v1/queue` | Exists but uses Prisma | HIGH |
| `GET /api/v1/dashboard` | Exists but uses Prisma | HIGH |
| `PATCH /notifications/:id/read` | Exists (Prisma) | HIGH |
| `PATCH /notifications/read-all` | Exists (Prisma) | HIGH |
| `GET /api/v1/providers` | Route exists, NOT mounted in router | CRITICAL |
| `GET /api/v1/services` | Route exists, NOT mounted in router | CRITICAL |
| `GET /api/v1/calendar` | Route does NOT exist | HIGH |
| `GET /api/v1/reports` | Route does NOT exist | HIGH |
| `POST /api/v1/sync/batch` | Exists but uses Prisma | HIGH |
| `GET /api/v1/sync/changes` | Exists but uses Prisma | HIGH |

---

## Q. Frontend/Backend Mismatches

| Issue | Severity |
|-------|----------|
| Frontend `useAuth` store calls `loginAction(data.token, data.expires_in, data.staff, data.ref_block, deviceId)` — `data.staff.id` will be a string ObjectId, but `authStore` types it as `Staff` which has `id: number` | HIGH |
| Frontend `src/api/types.ts` — all entity IDs typed as `number` | HIGH |
| Frontend `idParam` validator coerces to number — MongoDB ObjectIds are strings | CRITICAL |
| Frontend `dealers.ts` calls `GET /dealers/:id` with numeric ID | HIGH |
| Frontend `requests.ts` calls `GET /requests/:id` with numeric ID | HIGH |
| Frontend `visits.ts` calls `GET /visits/:id` with numeric ID | HIGH |

---

## R. MongoDB/Prisma/MySQL Remnants

| File | Issue |
|------|-------|
| `server/prisma/schema.prisma` | Full Prisma MySQL schema |
| `server/prisma/seed.ts` | Prisma seed |
| `server/package.json` | `@prisma/client`, `prisma` dependencies + scripts |
| `server/src/routes/index.ts` | `import { prisma } from '../config/database'` — `prisma` is not exported |
| `server/src/modules/dealers/dealer.repository.ts` | `import { prisma } from '../../config/database'` + `import { Prisma } from '@prisma/client'` |
| `server/src/modules/dealers/dealer.service.ts` | `import { Prisma } from '@prisma/client'` |
| `server/src/modules/requests/request.repository.ts` | `import { prisma }` + `import { Prisma }` |
| `server/src/modules/requests/request.service.ts` | `import { prisma }` |
| `server/src/modules/requests/request.mapper.ts` | `import { ... } from '@prisma/client'` |
| `server/src/modules/visits/visit.repository.ts` | `import { prisma }` + `import { Prisma }` |
| `server/src/modules/visits/visit.service.ts` | `import { prisma }` |
| `server/src/modules/visits/visit.mapper.ts` | `import { ... } from '@prisma/client'` |
| `server/src/modules/prospects/prospect.repository.ts` | `import { prisma }` + `import { Prisma }` |
| `server/src/modules/prospects/prospect.service.ts` | `import { prisma }` |
| `server/src/modules/prospects/prospect.mapper.ts` | `import { ... } from '@prisma/client'` |
| `server/src/modules/bootstrap/bootstrap.service.ts` | `import { prisma }` |
| `server/src/modules/dashboard/dashboard.routes.ts` | `import { prisma }` |
| `server/src/modules/notifications/notification.routes.ts` | `import { prisma }` |
| `server/src/modules/search/search.routes.ts` | `import { prisma }` |
| `server/src/modules/sync/sync.routes.ts` | `import { prisma }` |
| `server/src/modules/staff/setup.routes.ts` | `import { prisma }` |
| `server/tests/setup.ts` | `import { prisma }` |
| `server/tests/dealers.test.ts` | `import { prisma }` |
| `frontend/package.json` | `@prisma/client` dependency |

---

## S. Testing Gaps

| Gap | Severity |
|-----|----------|
| `tests/setup.ts` uses Prisma — tests cannot run | CRITICAL |
| `tests/dealers.test.ts` uses Prisma — tests cannot run | CRITICAL |
| No tests for: prospects, requests, visits, notifications, sync, bootstrap | HIGH |
| No idempotency tests for sync batch | HIGH |
| No authorization tests (forbidden scenarios) | HIGH |
| No prospect conversion tests | HIGH |
| No SLA/overdue calculation tests | MEDIUM |
| No timeline event tests | MEDIUM |

---

## T. Deployment Gaps

| Gap | Severity |
|-----|----------|
| `server/docker-compose.yml` — needs inspection | HIGH |
| No seed script for MongoDB (no admin user, no roles, no permissions, no master data) | CRITICAL |
| `server/.env.example` references MySQL `DATABASE_URL` instead of `MONGODB_URI` | HIGH |
| Frontend `.env` has `VITE_USE_MOCK=true` — production build will use mock data | CRITICAL |
| Provider and Service routes not mounted — those pages will 404 in production | CRITICAL |
| No `README.md` with setup instructions for MongoDB | HIGH |

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 24 |
| HIGH | 31 |
| MEDIUM | 12 |
| LOW | 5 |

**Root cause of most issues:** The backend was designed with Prisma/MySQL, then Mongoose models were added, but the repositories/services/mappers were never migrated from Prisma to Mongoose. The server will crash on startup because `routes/index.ts` imports `prisma` from `config/database.ts` which does not export it.
