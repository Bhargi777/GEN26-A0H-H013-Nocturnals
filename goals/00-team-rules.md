# CampusConnect: Team Rules (every agent reads this first)

These rules apply to all four developers and their agents. If a goal file conflicts with this file, this file wins.

## 1. Scope (current phase)

We are building only two modules:

- **Service Requests:** maintenance and facility issues (broken projector, light, Wi-Fi, hostel fixture), from report to verified resolution.
- **E-Governance:** administrative requests (bonafide certificate, NOC), from submission to approval and a downloadable document.

Out of scope for now: room reservation, canteen, lost and found, skills/volunteers, payments, email/SMS, mobile apps. Do not build or stub them.

## 2. Stack (fixed, do not swap)

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase: Postgres, Auth, Storage, Row Level Security
- `@supabase/ssr` for server and browser clients
- `zod` for all input validation
- `lucide-react` for icons
- `pdf-lib` for certificate PDFs
- One LLM provider for triage, wrapped behind one function so it can be swapped
- Vitest for unit tests
- Deployed on Vercel, one shared Supabase project

## 3. Who owns what (the main conflict prevention)

Only the owner edits a path. Need a change in someone else's path? Ask them, or write it down under BLOCKERS in your own goal file and move on.

| Path | Owner |
| --- | --- |
| `supabase/**` (core migrations, seed, policies) | Dev 1 |
| `lib/db/**`, `lib/auth/**`, `lib/types/**`, `lib/constants/**`, `lib/supabase/**` | Dev 1 |
| `middleware.ts`, `.env.example`, `package.json`, lockfile, `next.config.*`, `tsconfig.json` | Dev 1 |
| `app/layout.tsx`, `app/globals.css`, `tailwind.config.*` | Dev 2 |
| `app/(auth)/**`, `app/(app)/layout.tsx`, `app/(app)/dashboard/**`, `app/(app)/notifications/**`, `app/(app)/ui/**` | Dev 2 |
| `components/ui/**`, `components/layout/**` | Dev 2 |
| `app/(app)/service-requests/**`, `components/service-requests/**`, `lib/ai/**` | Dev 3 |
| `app/(app)/requests/**`, `app/(app)/office/**`, `app/(app)/admin/reports/**`, `app/verify/**`, `components/admin-requests/**`, `lib/pdf/**` | Dev 4 |
| `goals/0X-*.md` | only the developer whose number it is |

Extra rules:

- **Dependencies:** only Dev 1 changes `package.json` or the lockfile. Never run `npm install <pkg>` on your own branch. Ask Dev 1.
- **Migrations:** never edit a migration that exists on `main`. Dev 3 and Dev 4 may add new migration files only, named `<timestamp>_svc_<what>.sql` (Dev 3) or `<timestamp>_gov_<what>.sql` (Dev 4), for functions or indexes in their own module. Core tables belong to Dev 1.
- **Shared constants:** roles, statuses and categories live in `lib/constants/` (Dev 1). Import them; never redefine string literals.
- **Shared UI:** use components from `components/ui/`. If one is missing, build a local version inside your own `components/<module>/` folder and tell Dev 2.

## 4. Git and commit rules (strict)

### Authorship

- Commits must be authored by the developer, never by the agent.
- Do **not** run `git config` to change `user.name` or `user.email`. Do not use `--author`.
- Do **not** add `Co-Authored-By:` trailers, "Generated with", "Created by", or any agent or AI tool name in commit messages, PR titles, PR bodies, code comments or docs.
- Before the first commit, run `git config user.name` and `git config user.email` and confirm they show the developer. If they are empty, stop and ask the developer to set them.

### Commit style

- Conventional Commits: `type(scope): short imperative summary`, lowercase, no trailing period, max 72 characters.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.
- Scopes: `db`, `auth`, `api`, `ui`, `layout`, `service-requests`, `ai`, `e-governance`, `pdf`, `reports`, `seed`, `goals`.
- Examples:
  - `feat(service-requests): add issue report form with photo upload`
  - `fix(db): block technician from closing unverified tickets`
  - `test(ai): cover keyword fallback for network issues`
  - `docs(goals): mark triage fallback item done`
- Body (optional): what changed and why, in plain sentences. No time estimates, no durations, no hours.

### Commit often

- One logical change per commit. A new component, a new migration, a new server action, a fix, a test: each is its own commit.
- Commit as soon as a step works. Never batch a whole feature into one commit.
- Before every commit: `npm run typecheck` and `npm run lint` must pass. Run tests if you touched tested code.
- Never commit `.env*` files with real values, secrets, or `node_modules`.

### Branches and merging

- Work only on your branch: `feat/backend` (Dev 1), `feat/frontend` (Dev 2), `feat/service-requests` (Dev 3), `feat/e-governance` (Dev 4).
- Never push to `main`. Never force-push a shared branch.
- Rebase often: `git fetch origin && git rebase origin/main`. Resolve conflicts only inside your own paths; if a conflict is in someone else's path, take their version (`main`) and note it under BLOCKERS.
- Open small pull requests into `main` whenever a usable slice works. Merge order for the first round: Dev 1 foundation, then Dev 2 shell, then Dev 3 and Dev 4.

## 5. Data contract (Dev 1 implements, everyone codes against it)

### Roles (`lib/constants/roles.ts`)

`student`, `faculty`, `technician`, `dept_admin`, `office_staff`, `admin`

### Core tables

- `departments`: id, name, code (e.g. ELEC, NET, CIVIL, HOSTEL, CSE)
- `buildings`: id, name, code
- `rooms`: id, building_id, name, floor. Kept now so reservation can reuse it later.
- `profiles`: id (= auth user id), full_name, email, roll_no (nullable), role, department_id (nullable), created_at
- `service_tickets`: id, code (`SR-000123`), requester_id, title, description, category, priority, status, building_id, room_id (nullable), location_note, assigned_department_id, assigned_to (nullable), ai_suggested_category, ai_suggested_priority, ai_confidence, duplicate_of (nullable), photo_path (nullable), rating (1 to 5, nullable), feedback (nullable), created_at, updated_at, resolved_at, closed_at
- `ticket_followers`: ticket_id, user_id, created_at ("I have this issue too")
- `admin_requests`: id, code (`AR-000123`), requester_id, type, purpose, details (jsonb), status, current_reviewer_role, decided_by (nullable), decision_note (nullable), document_path (nullable), created_at, updated_at, decided_at
- `events` (audit log): id, entity_type (`ticket` or `admin_request`), entity_id, actor_id, action, from_status, to_status, note, created_at
- `notifications`: id, user_id, title, body, link, read_at (nullable), created_at

### Statuses (`lib/constants/statuses.ts`)

- Ticket: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED`
- Admin request: `PENDING_DEPT`, `PENDING_OFFICE`, `APPROVED`, `REJECTED`

### Ticket categories and priorities

- Categories: `ELECTRICAL`, `NETWORK`, `AV_EQUIPMENT`, `PLUMBING`, `FURNITURE`, `CLEANLINESS`, `HOSTEL`, `OTHER`
- Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### Admin request types

- `BONAFIDE`: goes straight to `PENDING_OFFICE`
- `NOC`: starts at `PENDING_DEPT`, then `PENDING_OFFICE`
- Type rules live in one config object so adding a type is a data change, not new code paths.

### Rules enforced in the database, not only the UI

- Status changes happen only through SQL functions (`transition_ticket`, `decide_admin_request`) that check the caller's role and the allowed transition, then write an `events` row and a `notifications` row in the same transaction.
- Only the requester can move a ticket from `RESOLVED` to `CLOSED` or `REOPENED`.
- RLS: students see only their own tickets and requests. Technicians and dept admins see tickets for their department. Office staff see admin requests at `PENDING_OFFICE` and later. Admin sees everything.
- Sign-up is limited to domains listed in `ALLOWED_EMAIL_DOMAINS`, checked on the server.

## 6. UI rules (clean, simple, not generic)

The app should look like a well-made internal tool used by a university office.

### Visual tokens

- Page background `#F8FAFC`, surfaces white, borders `#E2E8F0`
- Text `#0F172A` (primary), `#475569` (secondary)
- One accent only: teal `#0F766E`, hover `#115E59`, light tint `#F0FDFA`
- Status badges, muted pairs (light background, dark text):
  - `OPEN` and `CLOSED`: slate
  - `ASSIGNED`, `PENDING_DEPT`, `PENDING_OFFICE`: blue
  - `IN_PROGRESS`: amber
  - `RESOLVED`, `APPROVED`: green
  - `REOPENED`: orange
  - `REJECTED`: red
- Font: Inter via `next/font`. Body 14px, page titles 20px semibold, section titles 16px semibold.
- Spacing on a 4px grid. Radius 6px for inputs and buttons, 8px for cards. Shadows: none or the smallest.
- Icons: lucide, 16px, only where they help scanning.

### Layout

- Left sidebar with role-based links, top bar with the user name and the notification bell.
- Each page: a header with the title, one line of context, and at most one primary action on the right.
- Lists are tables with sortable columns and filters, not card grids.
- Detail pages: main content on the left, a status timeline from `events` on the right.
- Empty states: one plain sentence and one action button.

### Banned

- Gradients, glassmorphism, glows, neon, colored shadows
- Emoji in the interface
- Sparkle or magic-wand icons for AI features
- Hero sections, marketing copy, "Welcome back!" banners, animated counters
- Lorem ipsum or placeholder names like "John Doe"
- More than one accent color, rainbow charts

### Copy

- Plain and specific: "Report an issue", "Request a certificate", "Mark as resolved".
- AI output is shown as a suggestion: "Suggested category: Network", with the field still editable.
- Error messages say what happened and what to do next.

### Accessibility

- Every input has a visible label. Visible focus rings. AA contrast. Everything works with the keyboard.
- Layout works on a 375px-wide phone screen.

## 7. How every agent works

1. Read this file, then your own goal file.
2. Work through your "Done when" checklist in order.
3. After each item: make it work, run typecheck and lint, commit, then tick the box in your goal file in a separate `docs(goals): ...` commit.
4. If blocked by someone else's work: code against the contract in section 5 with a local stub, write the blocker under BLOCKERS in your goal file, and continue with the next item.
5. Do not stop until every item is ticked or only items listed under BLOCKERS remain. Then write a short summary at the end of your goal file of what works, how to test it, and what is still blocked.
6. Never expand scope beyond your goal file. If you think something is missing, add it under SUGGESTIONS instead of building it.
