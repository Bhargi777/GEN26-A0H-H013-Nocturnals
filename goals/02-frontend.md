# Goal: Dev 2, Frontend Foundation and Design System

Branch: `Vikranth` (explicit developer instruction)
Read `goals/00-team-rules.md` first. It is part of this goal, especially section 6 (UI rules).

## Your role

You own how the whole app looks and feels: the design tokens, every shared component, the app shell, sign-in, dashboards and notifications. Dev 3 and Dev 4 build their pages from your components, so ship the components early and keep their APIs stable.

Until Dev 1's foundation is on `main`, build against the contract in the team rules using local mock data in `app/(app)/ui/`, then switch to the real data layer once it lands.

## Done when

### Phase A: design system

- [x] Tailwind config with the exact tokens from the team rules (colors, radius, font sizes). No other colors used anywhere.
- [x] Inter loaded through `next/font`, applied globally.
- [ ] Components in `components/ui/`, each typed, accessible, and keyboard-friendly:
  - [x] `Button` (primary, secondary, ghost, danger; sizes sm and md; loading state)
  - [x] `Input`, `Textarea`, `Select`, `Label`, `FieldError`, `FormField` (label + control + help + error)
  - [x] `FileInput` for a single image, with preview and size check
  - [x] `Badge` and `StatusBadge` (maps every status in `lib/constants` to its muted color pair)
  - [x] `Card`, `PageHeader` (title, one line of context, one primary action slot)
  - [x] `DataTable` (columns, sorting, empty state, row link, simple pagination)
  - [x] `FilterBar` (status, category, date range, search text)
  - [x] `Timeline` (renders `events` rows: actor, action, status change, note, relative time)
  - [x] `Dialog` for confirmations, `Toast` for success and error feedback
  - [x] `EmptyState` (one sentence, one action)
  - [ ] `Skeleton` loading rows
- [ ] A gallery page at `/ui` showing every component and every badge state, so teammates can copy usage.

### Phase B: app shell

- [ ] `app/(app)/layout.tsx`: left sidebar, top bar with user name, role, notification bell with unread count, and sign-out.
- [ ] Sidebar links depend on role:
  - student and faculty: Dashboard, My service requests, Report an issue, My certificates, Request a certificate
  - technician and dept_admin: Dashboard, Department queue, plus the student links for their own requests
  - office_staff: Dashboard, Office review queue
  - admin: everything, plus Reports
- [ ] Sidebar collapses to a menu on phone width.
- [ ] Sidebar uses the routes owned by Dev 3 and Dev 4 (`/service-requests`, `/service-requests/new`, `/service-requests/queue`, `/requests`, `/requests/new`, `/office`, `/admin/reports`). You only link to them; you do not build those pages.

### Phase C: auth pages

- [ ] `/sign-in` with email and password, clear errors, and a note that only campus accounts are accepted.
- [ ] `/sign-up` that shows the server's domain rejection message in plain words.
- [ ] Signed-in users visiting auth pages are sent to `/dashboard`.

### Phase D: dashboards and notifications

- [ ] `/dashboard` changes by role:
  - requester: counts of open service requests and pending certificates, and their five most recent items with status badges
  - technician and dept_admin: counts by status for their department queue, and the oldest unresolved tickets
  - office_staff: count waiting for review, and the oldest pending requests
- [ ] `/notifications`: list, unread first, mark one read, mark all read, each notification links to its item.
- [ ] The bell shows the unread count and a short dropdown of the latest five.

### Phase E: quality pass

- [ ] Every page checked at 375px and 1280px wide.
- [ ] Keyboard-only walk-through of sign-in, dashboard and notifications works.
- [ ] Contrast checked against AA.
- [ ] No banned patterns from the team rules anywhere.
- [ ] Review Dev 3 and Dev 4 pages after they merge and open small `style(ui): ...` pull requests only inside your own paths, or list fixes for them under SUGGESTIONS.

## Hand-offs

- Merge Phase A and Phase B as early as they work. Tell Dev 3 and Dev 4 the components are on `main`.
- Do not change a component's props after others use it. Add new optional props instead.

## BLOCKERS

- Dev 1 integration: package manifest, lockfile, build configuration, shared
  constants, auth/session helpers and database APIs have not landed. Frontend
  work uses an explicit local preview adapter under `app/(app)/ui/`. This
  adapter must be replaced with authorized server APIs before production.
- Repository typecheck/lint scripts cannot run without Dev 1's package manifest.
  Until it lands, each commit is checked with `npm run typecheck` and
  `npm run lint` in an isolated temporary Next.js 15 / React 19 / Tailwind 3
  validation workspace containing a copy of the owned source. No dependency
  manifests or tool configuration are added to the repository.
- Dev 3 and Dev 4 pages are not on main; their post-merge review remains blocked.

## SUGGESTIONS

- Dev 1: expose the frontend adapter's auth, profile, dashboard and notification
  operations with server-authorized data and campus-domain validation. Replace
  preview constants with imports from `lib/constants` during integration.

## Summary

Implementation in progress. Completed boxes indicate verified frontend behavior
against the local preview adapter; production backend integration remains blocked.
