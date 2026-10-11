# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CampusConnect: Next.js 16 (App Router, React 19, `cacheComponents` on), TypeScript strict, Supabase (Postgres + Auth + Realtime), Tailwind v4, installable PWA with web push. Modules: service requests, rooms (floor plans), events + campus calendar, canteen, notifications, admin reports.

`AGENTS.md` says this Next.js has breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (e.g. `middleware` is now `proxy.ts`). The docs only exist after `npm install`.

## Commands

- `npm run dev` / `npm run build` / `npm run start`; `npm run lint`; `npm run typecheck`
- Tests (Vitest, `vitest.config.ts` maps `@/`): all `npx vitest run`; one file `npx vitest run lib/time.test.ts`; one test `npx vitest run -t "name"`. `tests/db.test.ts` needs a live Supabase; everything else is pure.
- `npm run build` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (any value works offline). CI (`.github/workflows/ci.yml`) runs typecheck, lint, vitest, build.
- Local backend: `supabase start -x studio,imgproxy,edge-runtime,vector,logflare,mailpit` (needs Docker/Colima), then `supabase db reset` (migrations + `seed.sql`). `supabase status -o env` gives the keys for `.env.local`. If `start` reports a container name conflict after a VM restart, run `supabase stop --no-backup` first. After `db reset` every browser session is invalid; sign in again.
- Env vars: `.env.example`. `NEXT_PUBLIC_DEMO_MODE=true` adds one-click role buttons on the sign-in page (seed accounts only; never in real use). The service-role key is never used by the app.
- Dev-server quirk: after deleting routes, stale `.next/types` makes `tsc` fail; restart `next dev` (or delete `.next`).

## Database (supabase/)

Migrations apply in filename order, then `seed.sql` (all users use password `password123`, domain `example.edu`; emails per role such as `cr.cse@`, `office.cse@`, `kitchen.main@`, `kitchen.north@`, `manager.north@`, `ieee.president@`, `office.it@`, `osa.staff@`, `director.campus@`, `admin.sys@`). The seed also inserts `auth.identities` rows and a "demo day" of data; users inserted straight into `auth.users` need `instance_id`, `aud` and an identity or GoTrue rejects the login.

Design rule: **RLS is on everywhere and the browser never writes cross-user state directly.** Privileged writes are `SECURITY DEFINER` RPCs that check role, IST windows, capacity and prices in SQL: `request_room_booking`, `decide_room_booking`, `cancel_room_booking`, `cancel_class`, `place_order`, `advance_order`, `set_item_given`, `forfeit_unpaid_orders`, `transition_ticket`, `send_test_notification`; read helpers `room_slot_status`, `floor_availability`, `suggest_rooms`, `canteen_slot_load`, `campus_calendar`, `campus_report`. New tables need explicit `grant ... to authenticated` (Supabase does not default-grant; see `20261011300100_grants.sql`). Do not write policies that select from their own table (infinite recursion; `profiles` had this).

Scoping rules enforced in SQL (not just UI): canteen kitchen/counter/manager see and act only on `profiles.canteen_id` orders and menu/slots; department office/head/technician see only tickets of their `department_id`; a club president can only create events for `profiles.club_id`; `profiles_guard` stops non-admins changing role/department/club/canteen; `event_request_guard` gates event status moves; `transition_ticket` is a state machine (OPEN/REOPENED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED or REOPENED; requester may close OPEN/REOPENED).

Other invariants: partial unique index `room_bookings_one_approved` stops double booking (competing PENDING are allowed and auto-rejected on approval); order flow PLACED → PAID (counter) → READY (kitchen) → COLLECTED (kitchen or counter) and COLLECTED requires every `order_items.given` ticked; unpaid PLACED become FORFEITED after the slot; tokens are `<canteen code>-NNN` per IST day; canteen slots are 15-minute rows and `end_time > start_time` (no midnight wrap). Notifications are inserted by triggers only.

Push: trigger `push_on_notification` posts the user's `push_subscriptions` plus the notification to `app_settings.push_url` via `pg_net` with `x-push-secret`; `app/api/push/route.ts` verifies the secret and sends with `web-push` (no DB access). `app_settings` (push_url, push_secret) is set per environment by hand, never in migrations. Migration versions must be unique across environments: a version already pushed to the hosted project cannot be re-pushed with different content (use `supabase migration repair`).

Roles: 14-value `user_role` enum mirrored in `lib/constants/roles.ts`; `app/(app)/ui/preview-contract.ts` re-exports it and holds status labels and tones (add new statuses there and in `components/ui/badge.tsx`).

## Frontend architecture

- **Auth/session:** `proxy.ts` (Supabase cookie session) redirects signed-out requests to `/sign-in`, except `PUBLIC_PATHS` (service worker, manifest, offline page, icons, `/api/push`). `components/layout/frontend-provider.tsx` loads the profile (incl. `canteen_id`, `club_id`) and notifications through `lib/frontend/supabase-adapter.ts` and subscribes to realtime. `navigationForRole(role, canteenId)` in `components/layout/navigation.tsx` builds per-role nav; canteen staff get links only to their own canteen.
- **Supabase clients:** use `getSupabase()` (`lib/supabase/browser.ts`, untyped cookie-session client) in client code; `lib/supabase/server.ts` in server components and route handlers. A plain `@supabase/supabase-js` client has no cookie session.
- **Data layer:** `lib/db/*` per module with row types in `lib/types/campus.ts`. Reads are RLS-filtered selects; writes call the RPCs. `lib/algo/` has a `MinHeap` (top-k, queue order) and interval search/merge/lane partitioning (calendar day timeline, hall-clash warning); `lib/calendar-grid.ts` builds month grids.
- **Page pattern:** client pages wrap content in `RoleGate` (UI only; RLS/RPCs enforce) or `CanteenGate` (also checks the route canteen id against `profile.canteen_id`), load through `lib/db`, and subscribe with `supabase.channel().on("postgres_changes", ...)`. Shared pieces: `components/canteen/{use-canteen-orders,handover}.tsx`, `components/events/{event-summary,review-actions}.tsx`, `components/rooms/floor-plan.tsx`.
- **Dashboard:** `app/(app)/dashboard/dashboard-model.ts` is a pure `dashboardFor(profile, data)` for all 14 roles; `lib/db/dashboard.ts` loads only what each role needs.
- **Service requests** is the oldest module (server components, `_lib/`, server actions in `actions.ts`). Server pages that read the clock must `await requestTime()` (it calls `connection()`), or `cacheComponents` fails the build with a `Date.now()` prerender error. `lib/ai/*` is the triage logic (Anthropic key optional; keyword fallback).
- **PWA:** `app/manifest.ts`, hand-written `public/sw.js` (offline page, static cache, push and notification-click handlers), `components/pwa/pwa-provider.tsx` (registers the worker, install banner, optional `NEXT_PUBLIC_APK_URL`), `components/pwa/push-opt-in.tsx` (subscribe, test button). Icons come from `scripts/generate-icons.py`.
- No corner popups: `useToast` shows errors as a top banner and announces successes to screen readers only; the bell is a plain link.

## Styling

`tailwind.config.ts` (loaded by `@config` in `app/globals.css`, keep it) **replaces** the default theme. Only these colors exist: `background surface border primary secondary accent(-hover/-light) status-{slate,blue,amber,green,orange,red}-{light,dark}`; fonts `text-body/section/title`; radii `control`/`card`; a custom spacing scale. Default palette classes (`slate-*`, `red-*`, `amber-50`, ...) silently do nothing. The page is light-only. Use `components/ui/*` and the `.control` class.

## Time

All scheduling is IST. Use `lib/time.ts` (`istDate`, `istTime`, `istInstant`, `isBookableDay`, `isValidCanteenSlot`) rather than browser-local dates; SQL uses `ist_now()`. Booking window: today to +14 days. Canteen pickup: slot starts at least 15 min out and ends within 60 min.

## Deploy and conventions

Hosted: Supabase project `szqpthkoufzuvhizvvew` (linked via `supabase link`; `supabase db push`) and Vercel project `campusconnect` (`vercel deploy --prod`). `NEXT_PUBLIC_*` vars are baked at build time, so set Vercel env vars before deploying. `README.md` has the live URL and the feature table. Conventional commits; `README.md` lists per-dev branches and ownership and `goals/*.md` hold per-module specs. Do not push to git without being asked.
