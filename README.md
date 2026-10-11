# CampusConnect

CampusConnect is an internal university tool for managing service requests and e-governance administrative tasks.

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd campusconnect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `ALLOWED_EMAIL_DOMAINS`: e.g. `example.edu`
   - `NEXT_PUBLIC_APP_URL`: e.g. `http://localhost:3000`
   - `ANTHROPIC_API_KEY`: Your LLM API key
   - `AI_MODEL_NAME`: e.g. `claude-3-5-haiku-20241022`

4. **Demo Data Setup (Database):**
   Run the Supabase seed script in your project to populate demo data.
   Demo user passwords are `password123`.

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking
- `npm run test`: Run Vitest

## Branches

Work only on your assigned branch. Never push directly to `main`.
- `feat/backend`: Dev 1
- `feat/frontend`: Dev 2
- `feat/service-requests`: Dev 3
- `feat/e-governance`: Dev 4

## Ownership Table

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

## Live demo

https://campusconnect-bhargi777s-projects.vercel.app (Vercel, backed by a hosted Supabase project in ap-south-1). Demo mode is on, so the sign-in page has one button per seeded role. Every seeded account uses the password `password123`; turn off `NEXT_PUBLIC_DEMO_MODE` and drop the seed before real use.

Deploy steps used: `supabase projects create`, `supabase link`, `supabase db push --include-seed`, then `vercel env add` for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_DEMO_MODE`, then `vercel deploy --prod`. The service-role key is never given to the app.

## Run it locally with the Supabase CLI

```bash
npm install
supabase start            # needs Docker (or Colima)
supabase db reset         # applies supabase/migrations and supabase/seed.sql
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from `supabase status -o env`
# set NEXT_PUBLIC_DEMO_MODE=true to get one-click role buttons on the sign-in page
npm run dev
```

Seeded accounts all use the password `password123`. With `NEXT_PUBLIC_DEMO_MODE=true` the sign-in page shows a button per role. Never enable demo mode, or load `seed.sql`, against a real project.

## What is in the app

| Module | Who | What |
| --- | --- | --- |
| Service requests | everyone, technicians, department staff | report issues with photo, AI-assisted triage and duplicate detection, queue, overdue tracking |
| Rooms | faculty, class reps, department office | floor plans with live availability per date and period, "find me a room", approval queue, class cancellation frees the room |
| Events | club presidents, student affairs, campus director, events department | request, review, approve, calendar, notified at every step |
| Canteen | students, counter, kitchen, manager | menu, cart, 15 minute pickup slots (IST), tokens, realtime kitchen and counter screens, display board |
| Campus pulse | admin, campus director | one page of service, room, canteen and event numbers |
| Notifications | everyone | created by database triggers on every status change, live in the nav |

## Architecture and security

- Next.js App Router and Supabase. The browser only ever holds the anon key and a cookie session, so every query runs as the signed-in user under row-level security.
- Anything that needs a cross-user check is a `SECURITY DEFINER` function: `request_room_booking`, `decide_room_booking`, `place_order`, `advance_order`, `cancel_class`, `campus_report` and others. They validate role, IST date windows, capacity and prices in SQL, so a modified client cannot skip a rule.
- Double booking is prevented by a partial unique index; event hall clashes by an exclusion constraint; role changes by a trigger.
- Notifications are inserted by triggers, never by the client.
- `proxy.ts` redirects signed-out requests to `/sign-in`.
