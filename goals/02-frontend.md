# Goal: Dev 2, Frontend Foundation and Design System

Branch: `Vikranth` (explicit branch instruction)
Read `goals/00-team-rules.md` first. It is part of this goal, especially section 6 (UI rules).

## Your role

You own the design tokens, shared components, app shell, auth pages, dashboard and notifications. Dev 3 and Dev 4 build on your components, so ship them first and keep their props stable.

## Working rules (follow these to stay efficient)

- Write each file once, complete. Do not scaffold then refine.
- Batch by phase: write all of a phase's files, then run `npm run typecheck && npm run lint` once, fix, then commit per file or per small group.
- Do not read files you did not write. Do not explore the repo. Everything you need is in this file and the team rules.
- No screenshots, no browser testing, no dev server loops. Check responsiveness by reading your own Tailwind classes.
- Do not write tests, stories or a component gallery.
- Keep every component under about 80 lines. If it grows past that, it is over-built.
- Until Dev 1's foundation is on `main`, type against `lib/types` and `lib/constants` as described in the team rules; if the import fails, declare the few types you need locally in `components/ui/types.ts` and delete that file after rebasing.

## Done when

### Phase A: tokens and components

- [x] Tailwind config with the exact tokens from team rules section 6. Inter via `next/font` in the root layout. `app/globals.css` sets the page background and base text color only.
- [x] `components/ui/index.ts` re-exports everything below so others import from one path.
- [ ] These components, all typed, labelled, keyboard-usable, with visible focus rings:
  - [x] `Button` (variants primary, secondary, ghost, danger; sizes sm, md; `loading` prop)
  - [x] `Field` (one component: label, required mark, control slot, help text, error text) plus plain `Input`, `Textarea`, `Select` styled with shared class strings
  - [ ] `FileInput` (single image, preview, rejects over 5 MB or non-image)
  - [ ] `StatusBadge` (one record mapping every status in `lib/constants` to a muted background and text pair, per team rules)
  - [ ] `Card`, `PageHeader` (title, one-line context, optional action slot)
  - [ ] `DataTable` (generic over a row type: columns with header, accessor and optional sort; `emptyState` prop; optional `rowHref`. Sorting is client-side on the current page. No built-in pagination; render rows the page passes.)
  - [ ] `FilterBar` (controlled: status select, category select, text search, optional date range; emits one filter object)
  - [ ] `Timeline` (renders `events` rows: actor, action, status change, note, relative time)
  - [ ] `Dialog` (confirm, with title, body, confirm and cancel) and `Toast` (success and error, one provider in the app shell)
  - [ ] `EmptyState` (one sentence, one optional action), `Skeleton` (one bar; pages repeat it)

### Phase B: app shell and auth

- [ ] `app/(app)/layout.tsx`: left sidebar, top bar with user name, role, notification bell with unread count, sign-out. Sidebar collapses behind a menu button under 768px. Toast provider lives here.
- [ ] Sidebar links come from one array keyed by role, not conditionals scattered in markup:
  - student, faculty: Dashboard, My service requests, Report an issue, My certificates, Request a certificate
  - technician, dept_admin: Dashboard, Department queue, plus the student links
  - office_staff: Dashboard, Office review queue
  - admin: all of the above plus Reports
  - Routes: `/dashboard`, `/service-requests`, `/service-requests/new`, `/service-requests/queue`, `/requests`, `/requests/new`, `/office`, `/admin/reports`. You only link to them.
- [ ] `/sign-in` and `/sign-up`: email and password, server error shown in plain words, a note that only campus accounts are accepted. Signed-in users hitting these routes go to `/dashboard`.

### Phase C: dashboard and notifications

- [ ] `/dashboard`: one page, one layout. A row of stat cards plus a recent-items table, both fed by a single role-keyed config object (which counts to show, which list to fetch). Do not write three separate dashboards.
  - requester: open service requests, pending certificates; recent five of their own items
  - technician, dept_admin: department counts by status; oldest unresolved tickets
  - office_staff: count waiting for review; oldest pending requests
  - admin: both sets
- [ ] `/notifications`: list with unread first, mark one read, mark all read, each row links to its item.
- [ ] Bell dropdown shows the unread count and the latest five.

### Phase D: close out

- [ ] Grep your own files for banned patterns from team rules section 6 (gradient, shadow-lg, emoji, sparkles, animate-) and remove any hit.
- [ ] Confirm every component is exported from `components/ui/index.ts` and the build passes.
- [ ] Write the Summary below: component list, import path, and any prop you expect to extend later.

Do not review or fix Dev 3 and Dev 4 pages. If you spot a problem there, add one line under SUGGESTIONS.

## Hand-offs

- Merge Phase A and Phase B as soon as they build. Tell Dev 3 and Dev 4 the components are on `main`.
- Never change an existing prop once others use it. Add new optional props instead.

## BLOCKERS

- Dev 1's foundation (package.json, tsconfig.json, lockfile, build config, lib/constants, lib/types, lib/auth, lib/db, lib/supabase) not on main. Cannot run `npm run typecheck` or `npm run lint`. Using local stubs in `components/ui/types.ts` and preview adapter in `app/(app)/ui/` per team rules section 18.

## SUGGESTIONS

(none yet)

## Summary

(write when done)
