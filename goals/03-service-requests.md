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
- [x] Every page follows the UI rules and works at 375px wide.
- [x] Empty, loading and error states exist on every page.

## Hand-offs

- Need a package or a core column? Ask Dev 1; do not edit `package.json` or core migrations.
- Missing a component? Build a local one in `components/service-requests/` and tell Dev 2.
- Leave a clear hook for the later room link: a function call point after a ticket on an `AV_EQUIPMENT` category is opened or closed, with a `TODO(reservation)` comment, nothing more.

## BLOCKERS

Checked against `main` after Dev 1 and Dev 2 merged. Each item names its owner.

1. **Seeded demo story (Dev 1).** `20261010200200_svc_demo_story.sql` adds `svc_seed_demo_story()`. It was tested against main's migrations on a local Postgres and walks the full story through the real `transition_ticket`. Three things are still needed:
   - `supabase/seed.sql` must call `select public.svc_seed_demo_story();`.
   - The seed needs an IT `dept_admin`. AV tickets route to IT, and IT has only a technician.
   - The seed's ids starting with `r`, `u`, `t` and `a` (for example `u0000000-…`) are not valid UUIDs, so `seed.sql` fails on Postgres.

   This is why the Phase E seed item is still open.
2. **RLS recursion (Dev 1).** The policy "Admins can read all profiles" reads `profiles` from inside a `profiles` policy. Any signed-in read of `service_tickets` then fails with `infinite recursion detected in policy for relation "profiles"` (reproduced on main's migrations). A `security definer` `is_admin()` helper used by the policies would fix it.
3. **Production build, Tailwind (Dev 2).** `app/globals.css` does not load `tailwind.config.ts`, so `next build` fails on main itself with `Cannot apply unknown utility class border-border`. Adding `@config "../tailwind.config.ts";` after the import fixes it.
4. **Production build, prerendering (Dev 2).** With `cacheComponents: true`, `AppShell` calls `usePathname()` outside `<Suspense>`, which breaks prerendering of dynamic routes such as `/service-requests/[code]`. Wrapping `AppShell` (or the part that reads the pathname) in `<Suspense>` fixes it. With items 3 and 4 applied locally, this branch builds and all four service-request routes prerender.
5. **Test setup (Dev 1).** No Vitest config resolves `@/`, so `app/(app)/ui/frontend.test.ts` fails on main. The tests in this module use relative imports and pass.
6. **`package.json` (Dev 1).** Add the script `"eval:triage": "tsx lib/ai/eval-triage.ts"` and `tsx` as a dev dependency. Until then the eval runs with `npx tsx lib/ai/eval-triage.ts`.
7. **`createTicket` fields (Dev 1).** `CreateTicketSchema` and `createTicket` do not accept `assigned_department_id`, `ai_suggested_category`, `ai_suggested_priority` or `ai_confidence`. Until they do, `saveTriageAndRouting` in `_lib/queries.ts` (marked `TODO(dev1)`) sets them right after creating the ticket, which RLS allows for the requester's own ticket. Without it new tickets reach no department queue.
8. **Reads missing from `lib/db` (Dev 1).** Buildings, rooms, departments, technicians, ticket by code, followers and similar tickets. They live in `app/(app)/service-requests/_lib/queries.ts` until `lib/db` offers them. `listMyTickets` and `listDepartmentTickets` return rows without names, so the module joins names itself.
9. **Event history (Dev 1).** `transition_ticket` writes `from_status` after the update, so it always equals `to_status`, and no event is written when a ticket is created. The timeline shows the new status only and adds a "Reported" entry from the ticket itself.
10. **Followers can't open what they follow (Dev 1).** RLS lets only the requester, the department and admins read a ticket. After "I have this issue too" the follower lands on a not-found page. They still get the notifications.
11. **Follower notifications trigger (Dev 1 sign-off).** `20261010200100_svc_follower_notifications.sql` adds a trigger on the core `notifications` table that copies the requester's ticket notifications to followers. Tested with main's `transition_ticket`. If Dev 1 prefers, `transition_ticket` can do the fan-out and this migration can be dropped.
12. **Photo size (Dev 1).** `next.config.ts` needs `experimental.serverActions.bodySizeLimit: "6mb"`, because photos up to 5 MB are uploaded through a server action and the default limit is 1 MB.
13. **Photo types (Dev 1, Dev 2).** The `ticket-photos` bucket allows JPEG, PNG and WebP, but `components/ui/FileInput` also offers GIF. The server rejects GIF with a clear message before upload.

## SUGGESTIONS

- Run `npm run eval:triage` once with `ANTHROPIC_API_KEY` set. The result in the summary only measures the keyword fallback, because no key was available here.
- `.env.example` sets `AI_MODEL_NAME=claude-3-5-haiku-20241022`, an old model. Leave it empty to use the default `claude-opus-5-5`, or set a current model. Triage falls back to rules if the model call fails.
- The keyword rules missed 2 of 28 fixtures: a projector complaint mentioning "power" and "light", and "geyser". They were left untuned so the eval stays honest.
- Routing follows the departments in `seed.sql`: Electrical goes to ELEC; Network and AV to IT; Plumbing, Furniture, Cleanliness and Hostel to Hostel Administration; Other to the Academic Office. A maintenance department would be a better home for plumbing and furniture; it is a one-line change in `lib/ai/routing.ts`.
- Show tickets the user follows on `/service-requests`, next to the ones they reported.

## Summary

24 of 25 items are done; the seeded demo story waits on Dev 1 (BLOCKERS 1). The module is rebased on main and uses only shared code from the other owners:
- constants from `lib/constants`;
- data access through `lib/db`: `createTicket`, `uploadTicketPhoto`, `transitionTicket` with `p_ticket_id, p_to_status, p_note, p_assigned_to`, `rateTicket`, `reassignTicketDepartment`, `followTicket`, `getTicket` and `getTicketEvents`;
- UI from `components/ui`: DataTable, FormField, FileInput, Card, PageHeader, StatusBadge, Timeline, Skeleton, EmptyState and the shared toast.

The local stubs and UI copies are deleted. Signed-out users go to `/sign-in`, and triage calls the Anthropic SDK from `lib/ai/model.ts` only.

**Triage eval:** running `lib/ai/eval-triage.ts` (what `npm run eval:triage` will run) gives **26/28 categories correct (92.9%)**. No API key was available, so all 28 were answered by the keyword rules; the model path has not been measured.

**Checks on this branch**
- `npm run typecheck` passes.
- `npm run lint` reports 8 problems, all in other owners' files and identical to main; none come from this module.
- `npm test -- --run`: all 99 tests pass, 93 of them in this module. The one failing file is Dev 2's `frontend.test.ts`, which also fails on main (BLOCKERS 5).
- `next build` fails on main itself (BLOCKERS 3). With BLOCKERS 3 and 4 applied locally, this branch builds.
- The three `_svc_` migrations were applied on top of main's migrations in a local Postgres:
  - The demo story runs end to end.
  - Followers receive copies of the requester's notifications.
  - `find_similar_tickets` finds a duplicate across requesters for a student, while unrelated faults in the same room return nothing.

**How to test once BLOCKERS 2 to 4 are fixed**
1. Sign in as a student.
2. Report an issue at `/service-requests/new`: the triage suggestion and the similar-issues list appear while typing.
3. As that department's admin, assign the ticket from `/service-requests/queue`.
4. As the technician, start and resolve it.
5. As the student, confirm it with a rating.
