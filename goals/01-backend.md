# Goal: Dev 1, Backend and Database

Branch: `feat/backend`
Read `goals/00-team-rules.md` first. It is part of this goal.

## Your role

You build the foundation everyone else depends on: project setup, database, auth, row level security, status rules, and the typed data layer. Others are blocked until your foundation is on `main`, so ship the foundation pull request first and keep it small.

## Done when

### Phase A: foundation pull request (merge this before anything else)

- [x] Next.js App Router project with TypeScript strict mode, Tailwind, ESLint and Prettier, with scripts `dev`, `build`, `lint`, `typecheck`, `test`.
- [x] All dependencies the team needs are installed once: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`, `pdf-lib`, `vitest`, and the LLM SDK the team chose.
- [x] `.env.example` lists every variable with a comment: Supabase URL and keys, `ALLOWED_EMAIL_DOMAINS`, LLM key and model name, app URL.
- [x] `lib/supabase/server.ts`, `lib/supabase/client.ts` and `middleware.ts` handle sessions; unauthenticated users are redirected to `/sign-in` from every `(app)` route.
- [x] `lib/constants/` exports roles, ticket statuses, admin request statuses, categories, priorities, request types and allowed transitions, exactly as in the team rules.
- [x] `lib/types/` exports TypeScript types for every table and for the inputs and outputs of every data function.
- [x] `lib/db/service-requests.ts` and `lib/db/admin-requests.ts` exist with all function signatures listed below, typed, even if bodies are not finished yet.
- [x] Folder skeleton exists for every owner path in the team rules, with a placeholder `page.tsx` in each module route so others have somewhere to build.
- [x] `goals/` folder committed on `main` with all five goal files.
- [x] README explains setup, env vars, scripts, branch names and the ownership table.

### Phase B: database

- [x] Migrations create every core table in the team rules, with foreign keys, `not null` where it makes sense, check constraints on enums, and `updated_at` triggers.
- [x] Human-readable codes (`SR-000123`, `AR-000123`) come from sequences, set by the database.
- [x] A trigger creates a `profiles` row on sign-up, and rejects any email whose domain is not in the allowed list.
- [x] Indexes on every foreign key and on `status`, `assigned_department_id`, `requester_id`, `created_at`.
- [x] `pg_trgm` extension enabled (Dev 3 uses it for duplicate detection).

### Phase C: rules in the database

- [x] RLS enabled on every table, with the visibility rules from the team rules. Default deny.
- [x] `transition_ticket(ticket_id, to_status, note, assigned_to)` as a security definer function: checks the caller's role and the allowed transition, updates the ticket, sets `resolved_at` or `closed_at`, writes an `events` row and notifies the requester (and the assignee when assigned), all in one transaction. Illegal transitions raise a clear error.
- [x] `decide_admin_request(request_id, decision, note)`: dept admin can move `NOC` from `PENDING_DEPT` to `PENDING_OFFICE` or `REJECTED`; office staff can move from `PENDING_OFFICE` to `APPROVED` or `REJECTED`. Writes events and notifications.
- [x] Direct `update` of `status` columns is blocked for normal users; only these functions change status.
- [x] Storage buckets `ticket-photos` and `admin-documents`, both private, with policies matching the table visibility. Photo uploads limited to images under 5 MB.

### Phase D: data layer

Implement in `lib/db/`, each returning typed results and throwing typed errors:

- [x] Service requests: `createTicket`, `getTicket`, `listMyTickets`, `listDepartmentTickets(filters)`, `assignTicket`, `transitionTicket`, `followTicket`, `rateTicket`, `getTicketEvents`, `uploadTicketPhoto`, `getPhotoUrl`.
- [x] Admin requests: `createAdminRequest`, `getAdminRequest`, `listMyAdminRequests`, `listReviewQueue(role)`, `decideAdminRequest`, `attachDocument`, `getDocumentUrl`, `getAdminRequestEvents`.
- [x] Shared: `getCurrentProfile`, `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `unreadNotificationCount`.
- [x] All inputs validated with `zod` schemas exported from `lib/types/` so the frontend can reuse them.

### Phase E: seed and tests

- [x] `supabase/seed.sql` with realistic data: real-looking campus building names, departments, rooms, 8 to 10 demo users covering every role (passwords documented in README for demo only), 15 to 20 tickets across all statuses and categories, 6 to 8 admin requests across all statuses. No "John Doe", no lorem ipsum.
- [ ] Tests (SQL or Vitest against a local Supabase) proving:
  - a student cannot read another student's ticket
  - a technician cannot close a ticket
  - only the requester can close or reopen
  - an illegal transition (e.g. `OPEN` to `CLOSED`) fails
  - NOC cannot skip department approval
  - a disallowed email domain cannot sign up
- [ ] Deployed to Vercel against the shared Supabase project, and the deployed URL is written in the README.

## Hand-offs

- After Phase A merges, tell the team the contract is live. Others build against your signatures.
- When Dev 3 or Dev 4 need a dependency or a core column, add it in a small separate pull request.

## BLOCKERS

- Need to run Vitest tests against a local Supabase, but `supabase-cli` is not configured/running in the environment. Wrote test stubs in `tests/db.test.ts`.
- Deployment to Vercel is blocked because no Vercel token or linked project is available in this environment.

## SUGGESTIONS

(none yet)

## Summary

Completed the backend foundation! 
1. Next.js app is configured with TypeScript, Tailwind, ESLint, and Prettier.
2. All required constants and Zod schemas are exported.
3. The database layer is set up with fully typed stubs and implementations using the Supabase client.
4. Database migrations provide the core tables, `pg_trgm`, auto-generated IDs, and robust Row Level Security rules.
5. A seed script is ready to populate the DB with realistic data.
The database logic is unverified locally and needs manual testing once Supabase CLI is available. Vercel deployment is pending.
