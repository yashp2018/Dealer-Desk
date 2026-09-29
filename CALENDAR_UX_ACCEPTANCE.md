# Calendar / Activity Management — UX Acceptance Checklist

Status against the 77-section Calendar + Activity Management specification. Checked items were
built and live-verified (browser, not just typecheck); unchecked items are honestly left open with
a reason — see `CALENDAR_IMPLEMENTATION_REPORT.md` §12–14 for the full narrative behind each
decision. This file tracks the checklist; that file explains the "why."

## Architecture & data

- [x] Inspected existing frontend/backend/DB/auth architecture before writing anything (Prisma +
      MySQL confirmed as the sole persistence layer; no Mongoose/second DB anywhere).
- [x] No second/duplicate persistence architecture introduced — one `calendar_activities` table.
- [x] Requests/Visits/Dealers/Prospects remain their own entities; Calendar Activities only
      reference them (`dealer_id` FK), never duplicate their data.
- [x] Unified `calendarEventMapper.ts` maps Request/Visit/Activity → FullCalendar events in one
      place, used by desktop, mobile, and the Dashboard widget — no duplicated mapping logic.
- [x] Timezone-safe: local date/time construction throughout (`new Date(y, m, d, h, min)`), no
      `date.toISOString().slice(0, 10)` anywhere in the calendar code; default timezone
      `Asia/Kolkata` only as a stored fallback, never hardcoded into date math.

## Activity model & types

- [x] Expanded activity type set: `task, reminder, meeting, followup, callback, sales_activity,
      payment_followup, delivery, service_followup` (9 types) on both backend validation and
      frontend mapper/options/labels/colors.
- [x] Centralized type/status/priority definitions (`ACTIVITY_TYPES` backend,
      `ACTIVITY_TYPE_OPTIONS`/`activityTypeLabels`/`calendarColors` frontend) — no inline literals
      duplicated across components.
- [x] Computed `is_overdue` field, matching the existing `Request.is_overdue` pattern exactly.
- [ ] `recurrence` / `location` / `externalReference` fields — **not added**. No existing recurrence
      engine to hook into; spec explicitly allows skipping if the backend can't support it cleanly.

## Desktop calendar (FullCalendar)

- [x] `dateClick` → opens create form with the clicked date/time prefilled (9am default for
      all-day/month-view cells).
- [x] `eventClick` → Activities open the details modal; Requests/Visits open their existing routes,
      untouched.
- [x] `eventDrop` / `eventResize` → persist via `PATCH .../move` and `.../resize`, revert on error
      with a toast (only user-created activities are draggable; system events are not).
- [x] Summary stat pills (Visits / P1·Escalation / Due) are real, computed from live data, and
      **clickable** — toggle a filter, highlight active state, add a dismissable chip.
- [x] Visual distinction between system-generated events (dashed outline) and user-created
      activities (solid outline).
- [ ] `ActivityTypeSelector` card-picker step before the create form — **not built**. The existing
      single-step form already includes a type `<select>`; adding a separate visual picker step is
      a net-new UI flow, not a fix, and was deliberately left for a follow-up pass.

## Create / edit flow

- [x] Sectioned, validated create form (title, type, date/time, reminder, dealer, priority, notes).
- [x] Inline validation (title required/length, end > start, dealer existence).
- [x] Duplicate-submission protection via `client_uuid` (idempotent create — verified: submitting
      the same UUID twice returns the same record, not a second one).
- [ ] Unsaved-changes confirmation on close — **not built**. Real gap; scoped out of this pass to
      keep the diff reviewable (see report §14.7).
- [ ] Schedule-conflict detection ("Go Back" / "Create Anyway") — **not built**, same reason.

## Activity details / actions

- [x] View/Edit/Complete/Delete all live-verified end to end (create → refresh-persists → edit →
      complete → delete → 404 confirms it's gone).
- [x] Complete is idempotent (calling it twice doesn't error or double-record).
- [x] Delete requires confirmation (existing modal, unchanged this pass).
- [ ] Duplicate / Reschedule as distinct one-click actions — not built as separate affordances;
      editing the date/time via the existing Edit flow covers reschedule, and Duplicate has no
      dedicated button. Flagged as a small, cheap follow-up, not attempted here to avoid scope creep
      into an area that already works via Edit.

## Mobile

- [x] 7-day view, vertical hourly timeline, tap-to-create.
- [x] Single, consistent 15-minute **floor** snapping rule (verified against all 4 of the spec's own
      worked examples).
- [x] Event card height reflects real `end - start` duration (48px minimum).
- [x] Central FAB (existing `MobileLayout`) offers a "Calendar Task" quick action alongside
      Request/Visit/Prospect — `/mobile/capture` untouched.
- [x] Dead, unwired duplicate mobile calendar (`MobileWeekPage.tsx`) removed in favor of the one the
      spec's own description matches (`MobilePlanningPage.tsx`), confirmed zero dangling references
      before deletion.

## Permissions & security

- [x] Reused the existing DB-backed Role/Permission architecture — no parallel permission system.
- [x] `calendar.view_own`, `calendar.view_all`, `calendar.create`, `calendar.edit`,
      `calendar.delete` permission keys exist and are enforced.
- [x] **Fixed this pass**: `GET /api/v1/calendar` (list) now scopes to the actor's own activities
      unless they hold `calendar.view_all` — previously returned every staff member's activities to
      everyone, regardless of permission. New test covers both sides (limited user sees only their
      own; `view_all` user sees everything). Full detail in report §14.1.
- [x] By-id routes already enforced per-record ownership (`canTouch`) before this pass — confirmed
      still passing (cross-user 403 tests, both pre-existing and new).
- [x] `owner_staff_id`/`created_by`/`updated_by` always taken from the authenticated JWT
      (`req.staff`), never trusted from the request body.
- [x] Dealer Portal tokens structurally cannot reach `/api/v1/calendar/*` at all — the `authenticate`
      middleware rejects non-staff token types before any route logic runs.
- [ ] Dedicated `calendar.assign` / `calendar.reschedule` / `calendar.export` permission keys — not
      added. No assign-to-another-user, reschedule-as-a-distinct-action, or export feature exists
      yet to gate, so adding unused permission keys would be dead configuration.

## Dashboard integration

- [x] "Today's Schedule" widget added, backed by real data (`useCalendarData` for today's range),
      reusing the same mapper/colors/labels as the main calendar — not a mock, not duplicated
      fetch/mapping logic. Live-verified: renders correctly, including the empty state when nothing
      is scheduled.

## Reminders, recurrence, notifications, attachments, comments

- [ ] Reminder **delivery** (push/scheduled notification at the configured offset) — not built.
      `reminder_minutes` is stored and shown; nothing dispatches at that offset, because there is no
      existing scheduled-job/notification-dispatch infrastructure in this codebase to hook into, and
      the spec forbids building a second one from scratch.
- [ ] Recurring activities — not built (see Architecture section above).
- [ ] Activity attachments — not built. Would need to reuse the existing Visit-attachment upload
      infrastructure (`server/src/common/utils/uploads.ts`) rather than build a second file-storage
      path; not attempted this pass to keep scope bounded.
- [ ] Activity comments/notes beyond the single `description` field, and dealer-safe redaction of
      them — not built; no comment sub-resource exists on `CalendarActivity` yet.
- [ ] Bulk actions on a Team Calendar view — not built; no Team Calendar (all-staff aggregate) view
      exists yet distinct from an individual's own calendar plus `view_all` filtering.

## Builds & tests

- [x] Backend: `tsc --noEmit` clean, `npm run build` clean, test suite **31/31 passing**.
- [x] Frontend: `tsc --noEmit` clean, `npm run build` clean.
- [x] Live browser verification (Playwright) this pass: login, Dashboard widget render, Calendar
      stat-pill filter toggle, zero unexpected 4xx/5xx responses.

## Honest summary

This pass closed one real security gap (cross-user list-endpoint leak), added the activity types
and computed field the spec called for, and added three genuinely useful, fully-verified UI
features (clickable stats, system/user visual distinction, Dashboard widget). It did **not**
attempt the remaining large, self-contained features (type-selector step, unsaved-changes/conflict
confirmations, recurrence, reminder delivery, attachments, comments, bulk actions) — each is real
scope, not a defect, and each is called out above rather than faked or stubbed.
