# Frontend integration

Import shared components from `@/components/ui`. See `/ui` for interactive
examples, all status badges, and development-only role previews. Public props
are additive: retain existing names and behavior when integrating module pages.

## Navigation handoff

The shell links to these module-owned routes without implementing them:

| Route | Purpose | Owner |
| --- | --- | --- |
| `/service-requests` | Requester's issues | Dev 3 |
| `/service-requests/new` | Report an issue | Dev 3 |
| `/service-requests/queue` | Department queue | Dev 3 |
| `/requests` | Requester's certificates | Dev 4 |
| `/requests/new` | Request a certificate | Dev 4 |
| `/office` | Office review queue | Dev 4 |
| `/admin/reports` | Reports | Dev 4 |

`navigationForRole` is the single source of sidebar links. Active links use the
longest matching route so creation and queue pages do not also select list links.
The menu follows native link keyboard behavior. Route visibility is presentation;
Dev 1 and module owners must enforce authorization on every server operation.

## Backend handoff

`FrontendProvider` accepts a `FrontendAdapter`. Its default development adapter
lives under `app/(app)/ui/preview-adapter.ts`, alongside fixture data and temporary
contract constants. Replace those constants with `lib/constants` imports when
Dev 1 provides the agreed exports. Replace the adapter with server-authorized
operations; never trust a role or profile supplied by the browser for access checks.

The preview requires explicit activation on `/ui`, uses session storage, contains
no real accounts, and is disabled for production. Authentication submissions do
not create a simulated login. Domain restrictions must be checked on the server;
the form displays the returned error or confirmation message verbatim as text.

Tailwind tokens currently target Tailwind 3.4. If the foundation uses Tailwind 4,
Dev 2 must adapt the owned stylesheet/config to that build setup. Inter is loaded
through `next/font/google`. The foundation must include Next.js, React, Tailwind,
TypeScript, Zod and lucide-react.
