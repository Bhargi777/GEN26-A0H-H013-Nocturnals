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
   - `OPENAI_API_KEY`: Your LLM API key
   - `AI_MODEL_NAME`: e.g. `gpt-4o-mini`

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
