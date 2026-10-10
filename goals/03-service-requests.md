# Goal: Dev 3, Service Requests and AI Triage

Branch: `feat/service-requests`
Read `goals/00-team-rules.md` first. It is part of this goal.

## Your role

You build the maintenance and facility issue module end to end, plus the AI-assisted triage and duplicate detection. Use Dev 1's data layer (`lib/db/service-requests.ts`) and Dev 2's components (`components/ui/`). Until they land on `main`, code against the contract with local stubs and swap them out later.

## Done when

### Phase A: requester flow

- [x] `/service-requests/new`: report form with title, description, building, room (optional, filtered by building), location note, optional photo, category and priority.
- [x] While the user types the description, triage runs (debounced) and shows "Suggested category" and "Suggested priority". The user can accept or change them. Both the suggestion and the final choice are saved.
- [x] Before submitting, possible duplicates are shown: "Similar open issues in this building". The user can follow an existing ticket ("I have this issue too") instead of creating a new one.
- [x] On submit: ticket created, photo uploaded, user sent to the ticket page with a success toast showing the ticket code.
- [x] `/service-requests`: table of the user's tickets with code, title, category, location, status badge, last update; filters for status and category.
- [x] `/service-requests/[code]`: details, photo, assigned department and person, timeline from events, followers count.
- [x] When status is `RESOLVED`, the requester sees "Confirm fixed" (moves to `CLOSED` and asks for a 1 to 5 rating and optional feedback) and "Still broken" (moves to `REOPENED` with a required note).

### Phase B: staff flow

- [x] `/service-requests/queue` for technician and dept_admin: department tickets in a table, filters for status, category, priority, building; sorted by priority then age; overdue rows marked.
- [x] Overdue rule in one config object: `URGENT` 4h, `HIGH` 24h, `MEDIUM` 72h, `LOW` 7 days, counted from creation until resolved.
- [x] Dept admin can assign a ticket to a technician in their department and reassign it to another department with a note.
- [x] Technician can move `ASSIGNED` to `IN_PROGRESS` and `IN_PROGRESS` to `RESOLVED` with a resolution note.
- [x] Every action uses `transitionTicket` from the data layer, never a direct update, and shows the database's error message clearly if it is refused.

### Phase C: AI triage (`lib/ai/`)

- [x] `triage({ title, description, buildingName })` returns `{ category, priority, departmentCode, confidence, source }` validated with `zod`. `source` is `"model"` or `"rules"`.
- [x] The model is asked for JSON only, with the allowed category, priority and department lists in the prompt. Invalid or out-of-list output is rejected and the rules fallback is used.
- [x] Never send the requester's name, email or roll number to the model. Only title, description and building name.
- [x] Timeout of a few seconds. On timeout, error or missing key, fall back to `lib/ai/rules.ts`: keyword rules (e.g. wifi, internet, lan to `NETWORK`; projector, speaker, mic, hdmi to `AV_EQUIPMENT`; fan, light, switch, socket to `ELECTRICAL`; leak, tap, flush to `PLUMBING`; sparks, smoke, flooding to `URGENT`).
- [x] Triage runs in a server action or route handler only, so the API key never reaches the browser.
- [x] Vitest tests for the rules fallback covering every category and the urgent keywords.
- [x] A small labelled set of 25 to 30 realistic sample complaints in `lib/ai/fixtures.json`, and a script `npm run eval:triage` that prints how many the triage gets right for category. Report the real number in your summary. Do not claim accuracy anywhere else.

### Phase D: duplicate detection

- [x] New migration `<timestamp>_svc_similar_tickets.sql` with a function `find_similar_tickets(building_id, text)` using `pg_trgm` similarity on title and description, limited to open tickets in the same building from the last 14 days, top 3 above a threshold.
- [x] The form calls it before submit and shows matches with code, title, status and how long ago.
- [x] Following a ticket adds the user to `ticket_followers`, and followers get the same notifications as the requester.

### Phase E: finish

- [ ] Seeded demo data walks through the full story: a student reports a broken projector, triage suggests `AV_EQUIPMENT`, the dept admin assigns a technician, the technician resolves it, the student confirms and rates it.
- [ ] Every page follows the UI rules and works at 375px wide.
- [ ] Empty, loading and error states exist on every page.

## Hand-offs

- Need a package or a core column? Ask Dev 1; do not edit `package.json` or core migrations.
- Missing a component? Build a local one in `components/service-requests/` and tell Dev 2.
- Leave a clear hook for the later room link: a function call point after a ticket on an `AV_EQUIPMENT` category is opened or closed, with a `TODO(reservation)` comment, nothing more.

## BLOCKERS

1. **Seeded demo story (Dev 1).** `supabase/migrations/20261010200200_svc_demo_story.sql` adds `svc_seed_demo_story()`, tested against a stand-in schema. It still needs Dev 1 to add `select public.svc_seed_demo_story();` at the end of `supabase/seed.sql`, after seeding a student, an ELEC `dept_admin`, an ELEC `technician` and at least one room. That is why the Phase E seed item is still open.
2. **No project scaffold on main (Dev 1, Dev 2).** `package.json`, `tsconfig.json`, `next.config.*`, `middleware.ts`, `app/layout.tsx`, `app/(app)/layout.tsx` and the Tailwind setup do not exist yet, so `npm run typecheck` and `npm run lint` cannot run. Until they land, each commit was checked from a toolchain outside the repo: `tsc --strict` with the standard Next.js tsconfig, ESLint `next/core-web-vitals` + `next/typescript` at zero warnings, and Vitest. Pages were also driven in a browser through a local harness with an in-memory data layer.
3. **Dependencies and scripts for `package.json` (Dev 1).** Runtime: `@anthropic-ai/sdk`, `zod`, `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`. Dev: `vitest`, `tsx`. Scripts: `"test": "vitest run"` and `"eval:triage": "tsx lib/ai/eval-triage.ts"`.
4. **`.env.example` (Dev 1).** Add `ANTHROPIC_API_KEY=` (server only, never `NEXT_PUBLIC_`) and optionally `TRIAGE_MODEL=` (defaults to `claude-opus-5-5`).
5. **`next.config.*` (Dev 1).** Set `experimental.serverActions.bodySizeLimit` to `"6mb"`. Photos up to 5 MB are uploaded through a server action, and the default limit is 1 MB.
6. **Stubs to swap once Dev 1's code is on main.** `app/(app)/service-requests/_stubs/constants.ts` maps to `lib/constants/*`, `_stubs/supabase.ts` to `lib/supabase/server`, and `_stubs/db.ts` to `lib/db/service-requests.ts`. Change the imports, then delete `_stubs/`.
7. **`transition_ticket` contract (Dev 1).** The data layer calls it with named parameters `p_ticket_id, p_to_status, p_note, p_assigned_to, p_department_id, p_rating, p_feedback`. The UI relies on these behaviours:
   - A dept admin can reassign within `ASSIGNED` (`ASSIGNED` to `ASSIGNED` with a new `p_assigned_to`).
   - A dept admin can move any open ticket to another department as `OPEN` with `p_department_id`, clearing `assigned_to`.
   - `RESOLVED` and `REOPENED` take a note.
   - `CLOSED` stores `p_rating` and `p_feedback`.
   - The requester's notification uses the link `/service-requests/<code>`.
8. **Ticket insert (Dev 1).** `createTicket` leaves `code` to the database (a default or trigger producing `SR-000123`) and does not write the first `events` row. The demo story adds a `created` event only if none exists.
9. **Storage (Dev 1).** A private `ticket-photos` bucket. Authenticated users upload under `<their user id>/`, and reads are allowed for whoever can read the ticket.
10. **RLS (Dev 1).**
    - Users can insert their own `ticket_followers` rows.
    - Followers can read the tickets they follow; otherwise "I have this issue too" opens a ticket the follower cannot see.
    - A dept admin can read technician profiles in their department.
    - `events` are readable by anyone who can read the ticket.
11. **Follower notifications trigger (Dev 1 sign-off).** `20261010200100_svc_follower_notifications.sql` adds a trigger on the core `notifications` table that copies requester notifications to followers. If Dev 1 prefers, `transition_ticket` can do the same fan-out, and this migration can be dropped.
12. **Shared UI (Dev 2).** `components/ui/` is missing, so local versions live in `components/service-requests/`: `button`, `form-field`, `status-badge`, `page-header`, `empty-state`, `toast`. Pages redirect to `/login` when signed out, so that route is assumed to exist.

## SUGGESTIONS

- Run `npm run eval:triage` once with `ANTHROPIC_API_KEY` set. The number in the summary only measures the keyword fallback, because no key was available here.
- The keyword rules missed 2 of 28 fixtures (a projector complaint mentioning "power" and "light", and "geyser"). They were left untuned on purpose so the eval stays honest. A larger labelled set would show whether AV words should weigh more.
- Triage uses `claude-opus-5-5` with low effort and a 4 second timeout. If timeouts show up often in logs, consider a faster model through `TRIAGE_MODEL`.
- The contract lists no AV department, so `AV_EQUIPMENT` routes to `ELEC` in `lib/ai/routing.ts`. If an AV team exists, add its code to the contract and change that one line.
- Show tickets the user follows on `/service-requests`, next to the ones they reported.

## Summary

(write when done, include the real triage eval result)
