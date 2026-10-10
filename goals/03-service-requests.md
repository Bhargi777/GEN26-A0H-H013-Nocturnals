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

(none yet)

## SUGGESTIONS

(none yet)

## Summary

(write when done, include the real triage eval result)
