# Goal: Dev 4, E-Governance (Administrative Requests), Documents and Reports

Branch: `feat/e-governance`
Read `goals/00-team-rules.md` first. It is part of this goal.

## Your role

You build the administrative request module end to end: requesting a bonafide certificate or NOC, routing it to the right approver, approving or rejecting it, generating the document, and the admin reports for both modules. Use Dev 1's data layer (`lib/db/admin-requests.ts`) and Dev 2's components (`components/ui/`). Until they land on `main`, code against the contract with local stubs.

## Done when

### Phase A: request types as configuration

- [x] One config object in `components/admin-requests/request-types.ts` (or the constants Dev 1 exports) describing each type: label, description, required fields with `zod` schemas, approval path, and document template name.
  - `BONAFIDE`: fields purpose, addressed to (optional); path: office only.
  - `NOC`: fields purpose (internship, competition, other), organisation name, start date, end date; path: department admin, then office.
- [x] Forms and approval screens are generated from this config, so adding a type later means adding one entry.

### Phase B: requester flow

- [ ] `/requests/new`: pick a type, then a form built from its fields, with validation messages in plain words.
- [ ] On submit: request created at the right first status (`PENDING_OFFICE` for bonafide, `PENDING_DEPT` for NOC), success toast with the request code.
- [ ] `/requests`: table of the user's requests with code, type, submitted date, status badge, and a download link when approved.
- [ ] `/requests/[code]`: details, who it is waiting on in plain words ("Waiting for department approval"), timeline from events, decision note if rejected, download button if approved.

### Phase C: reviewer flow

- [ ] Department admin sees NOC requests from their department at `PENDING_DEPT` in `/office` (filtered by role) and can forward or reject with a note.
- [ ] Office staff see requests at `PENDING_OFFICE` in `/office`, oldest first, and can approve or reject with a note. Reject requires a note.
- [ ] Every decision uses `decideAdminRequest` from the data layer and shows the database's error message clearly if it is refused.
- [ ] A confirmation dialog before approve and reject.

### Phase D: documents (`lib/pdf/`)

- [ ] On approval, a PDF is generated server-side with `pdf-lib` from a clean template: institution name, document title, request code, student name, roll number, department, purpose, issue date, and a verification line with the URL `/verify/<code>`.
- [ ] Sample letterhead text only. Add a visible line "Prototype document, not an official certificate" so it can never be mistaken for a real one.
- [ ] The PDF is stored in the private `admin-documents` bucket and linked to the request. Only the requester, office staff and admin can download it, through a short-lived signed URL.
- [ ] `/verify/[code]`: public page that only says whether the code is a valid approved document, its type and issue date. It shows no name, roll number or purpose.

### Phase E: admin reports

- [ ] `/admin/reports`, admin only, built from plain SQL queries (add new `<timestamp>_gov_report_views.sql` views if needed):
  - [ ] Service tickets by status and by category (simple bar charts or tables using the single accent color)
  - [ ] Overdue tickets list, using the same priority limits as Dev 3's config (import it, do not copy it)
  - [ ] Repeated issues: rooms with 3 or more tickets in the same category in the last 30 days
  - [ ] Admin requests: counts by type and status, and median days from submission to decision
- [ ] Every number on the page comes from a query. No hard-coded or invented figures.

### Phase F: finish

- [ ] Seeded demo data walks through: a student requests a NOC for an internship, the dept admin forwards it, office staff approve it, the student downloads the PDF, and `/verify/<code>` confirms it.
- [ ] Every page follows the UI rules and works at 375px wide.
- [ ] Empty, loading and error states exist on every page.

## Hand-offs

- Need a package or a core column? Ask Dev 1; do not edit `package.json` or core migrations.
- Missing a component? Build a local one in `components/admin-requests/` and tell Dev 2.
- You read Dev 3's overdue config; do not edit Dev 3's files.

## BLOCKERS

(none yet)

## SUGGESTIONS

(none yet)

## Summary

(write when done)
