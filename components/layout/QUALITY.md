# Frontend quality checks

Validated on 11 October 2026 against the local preview adapter. Backend
authorization, campus-domain policy and database persistence remain integration
checks for Dev 1. Module-owned routes are linked but are not implemented here.

## Responsive coverage

The browser check in `components/ui/browser-check.mjs` covers `/sign-in`,
`/sign-up`, `/ui`, `/notifications`, and `/dashboard` for student, faculty,
technician, department administrator, office staff and administrator. Each was
checked at 375px and 1280px: 20 page/viewport combinations, no document overflow.
Screenshots were captured and inspected. Wide tables scroll inside a labelled,
keyboard-focusable region; the document itself stays within the viewport.

## Keyboard walkthrough

- Sign-in: Tab to email and password, submit with Enter, recover focus on the
  first invalid input, correct the email, then receive the adapter error.
- Dashboard: reach the Reference sort control using Tab, activate with Enter,
  and verify the announced ascending sort state.
- Notifications: open the bell with Enter, reach its View all link with Tab,
  mark one notification read, reload to verify persistence, then mark all read.
  The bell count changes from four to three to zero.
- Mobile menu: open with Enter, close with Escape and return focus to its trigger.
- Confirmation: cycle focus within the modal, close with Escape and restore
  focus to the opening control.
- Sign-out: reach the action using Tab and activate with Enter; the sign-in
  screen appears and the preview session is cleared.

The same run verifies table filtering, pagination, empty results, invalid image
type/size errors, valid image preview/removal, five latest bell entries, all role
navigation variants and redirects from both auth pages. No browser page errors.

## Reproduction

The repository foundation is not present yet. Validation used a separate
temporary workspace with Next.js 15.5.14, React 19.1.1, Tailwind 3.4.17,
TypeScript 5.9.3, ESLint 9.39.1 and Vitest 3.2.4. Owned source was copied there;
typecheck, lint and the 15 unit tests ran before commits. No root dependency or
build configuration was added to this branch.

After the foundation is available, run its typecheck/lint scripts and Vitest
with the repository's `@/` alias. Start the development server, then run:

```sh
node components/ui/browser-check.mjs
```

The browser runner uses Playwright and `@axe-core/playwright`; install these in
an external validation environment or ask Dev 1 to supply them. It defaults to
`http://127.0.0.1:3100` and Edge. Override `FRONTEND_URL`, `BROWSER_CHANNEL` and
`QA_OUTPUT` as needed. Reports and screenshots default to the operating system's
temporary `ouramrita-frontend-qa` directory. The role preview is intentionally
disabled in production builds.
