# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CampusConnect: Next.js 16 (App Router, React 19, `cacheComponents` on), TypeScript strict, Supabase (Postgres + Auth + Realtime), Tailwind v4. Modules: service requests, rooms, events, canteen, notifications.

`AGENTS.md` says this Next.js has breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (e.g. `middleware` is now `proxy.ts`). Run `npm install` first; the docs only exist after install.

## Commands

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` (ESLint), `npm run typecheck` (`tsc --noEmit`)
- `npm test` (Vitest, watch mode); one run: `npx vitest run`; one file: `npx vitest run lib/time.test.ts`; one test: `npx vitest run -t "name"`
- `npm run build` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (any value works offline). Fonts are a system stack, so no network is needed.
- Env vars: see `.env.example`. Never use `SUPABASE_SERVICE_ROLE_KEY` in client code.
- `tests/db.test.ts` is a DB integration test needing a live Supabase; the other tests are pure.

## Database (supabase/)

Migrations apply in filename order; `seed.sql` follows. Test users are in `seed.sql` (password `password123`, domain `example.edu`, one per role: e.g. `cr.cse@`, `office.cse@`, `kitchen.main@`, `counter.main@`, `canteen.manager@`, `osa.staff@`, `director.campus@`). To check SQL without Supabase, run a local Postgres with stub `auth.users`/`auth.uid()`/`anon`/`authenticated` roles and a `storage.buckets` table that has `file_size_limit` and `allowed_mime_types` columns (Docker is not required).

Design rule: **RLS is on everywhere and the browser never writes cross-user state directly.** Privileged writes are `SECURITY DEFINER` functions in `20261011300000_rooms_canteen_notifications.sql`: `request_room_booking`, `decide_room_booking`, `cancel_room_booking`, `room_slot_status`, `place_order`, `advance_order`, `forfeit_unpaid_orders`, `canteen_slot_load`. They check role, IST date and time windows, capacity and prices in SQL. Notifications are created by triggers (rooms, events, orders), not by the client. Event status changes are gated by the `event_request_guard` trigger; `profiles_guard` stops non-admins changing `role`/`department_id`.

Double booking is prevented by the partial unique index `room_bookings_one_approved` (APPROVED only; competing PENDING requests are allowed and auto-rejected on approval). Canteen tokens are `<canteen code>-NNN` per canteen per IST day. Order flow: PLACED → PAID (counter) → READY (kitchen) → COLLECTED (counter); unpaid PLACED orders become FORFEITED after the slot ends.

Role set is the 14-value `user_role` enum, mirrored in `lib/constants/roles.ts` (`ROLES.STUDENT`, ...). `app/(app)/ui/preview-contract.ts` re-exports it and holds status labels and badge tones; add new statuses there and in `components/ui/badge.tsx`.

## Frontend architecture

- **Auth/session:** `proxy.ts` (Supabase cookie session) redirects unauthenticated requests to `/sign-in`. In the client, `components/layout/frontend-provider.tsx` loads the profile and notifications through `lib/frontend/supabase-adapter.ts` (implements `FrontendAdapter`; the dev-only `preview-adapter.ts` is just for the `/ui` gallery) and subscribes to realtime notifications. `AppShell` and `Navigation` (`components/layout/`) derive from that profile. Role-based navigation lives in `navigation.tsx` (`byRole`).
- **Supabase clients:** use `getSupabase()` (`lib/supabase/browser.ts`, untyped cookie-session client) in client code. `lib/supabase/client.ts` (typed) and `server.ts` (server components/actions) are used by the older service-requests code. Do not create a plain `@supabase/supabase-js` client in pages: it has no cookie session, so `auth.getUser()` returns null.
- **Data layer:** `lib/db/*` per module (rooms, canteen, events, dashboard, service-requests). Row shapes for the newer modules are in `lib/types/campus.ts`. Reads are RLS-filtered selects; writes call the RPCs above.
- **Page pattern:** client pages wrap content in `<RoleGate roles={[...]}>` (UI hiding only; RLS/RPCs enforce), load via the `lib/db` function, and subscribe with `supabase.channel().on("postgres_changes", ...)`. Staff canteen screens share `components/canteen/use-canteen-orders.ts`. Route-group `loading.tsx`/`error.tsx` use `components/ui/route-error.tsx`.
- **Dashboard:** `app/(app)/dashboard/dashboard-model.ts` is a pure `dashboardFor(profile, data)` covering all 14 roles; `lib/db/dashboard.ts` loads only the tables each role needs.
- **Service requests** (`app/(app)/service-requests`) is the oldest module and uses server components with `_lib/` helpers. `lib/ai/*` is its triage logic (Anthropic).
- **Events** (`app/(app)/events/*`): typed `lib/db/events.ts` (selects embed club and hall; status moves are plain updates checked by the `event_request_guard` trigger). Reviewer pages share `components/events/event-summary.tsx` (`EventSummary`, `useEvents` with realtime) and `review-actions.tsx` (`ReviewActions` with inline reason box).

## Styling

`tailwind.config.ts` (loaded by `@config` in `app/globals.css`, keep it) **replaces** the default theme. Only these colors exist: `background surface border primary secondary accent(-hover/-light) status-{slate,blue,amber,green,orange,red}-{light,dark}`; fonts `text-body/section/title`; radii `control`/`card`; a custom spacing scale. Default palette classes (`slate-*`, `red-*`, `amber-50`, ...) silently do nothing. Use `components/ui/*` (`Button`, `Card`, `FormField`, `DataTable`, `Dialog`, `StatusBadge`, `useToast`) and the `.control` class.

## Time

All scheduling is IST. Use `lib/time.ts` (`istDate`, `istTime`, `istInstant`, `isBookableDay`, `isValidCanteenSlot`) rather than browser-local dates; SQL uses `ist_now()`. Booking window: today to +14 days. Canteen pickup: slot starts at least 15 min out and ends within 60 min.

## Repo conventions

Conventional commits. `README.md` lists a per-dev branch and file ownership table, and `goals/*.md` hold the per-module specs; never push to `main`, and do not push without being asked.
