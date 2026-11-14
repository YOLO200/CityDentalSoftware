# Dentosys

Practice management for dental clinics and multi-branch practices: patient records, clinical visits, X-rays and documents, appointments, patient follow-up, enquiries and reports.

A React single-page app on top of Supabase (Postgres, auth, storage). Access control is enforced in the database with row-level security (RLS); the browser only ever holds the public anon key.

Originally exported from a [Figma Make design](https://www.figma.com/design/Or2eeriwCKJLgdgAZYVMnV/Healthcare-SaaS-Dashboard-Design). Most screens have since been wired to the real database, but not all of them (see [Current gaps](#current-gaps)).

## Tech stack

- React 18, TypeScript, Vite 6
- React Router 7 (data router, `src/app/routes.ts`)
- Tailwind CSS 4, Lucide icons, one shadcn/ui component (Radix Select)
- Recharts for charts
- Supabase JS client: auth, Postgres via PostgREST, storage
- Vitest + React Testing Library, ESLint 9
- Sentry for error reporting (optional)

## Getting started

Requires Node 22 and access to the Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

### Environment variables

| Variable | Required | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase → Project Settings → API (the anon/public key) |
| `VITE_SENTRY_DSN` | no | Sentry → project → Client Keys. Error reporting is off when empty. |
| `VITE_DEMO_EMAIL`, `VITE_DEMO_PASSWORD` | no | The public demo account (migrations 025 and 026). The demo panel is hidden when empty. |

Never put the Supabase **service-role** key in the frontend. It bypasses every RLS policy. It is only used server-side, inside the `invite-user` Edge Function.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/`. Does **not** typecheck. |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint. Warnings are allowed; errors fail CI. |
| `npm test` | Vitest, run once |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and tests on every push and pull request. It uses `npm install` rather than `npm ci` because `package-lock.json` is gitignored in this repo.

## Features

| Area | Route | Status |
|---|---|---|
| Landing page | `/welcome` | Public capabilities page. Logged-out visitors to `/` land here. |
| Login / invite acceptance | `/login`, `/accept-invite` | Invite-only. No public sign-up. |
| Onboarding | `/setup-profile` | Profile details and assigned centre, required before using the app |
| Dashboard | `/` | Per-branch KPIs, today's appointments, alerts, six-month Practice Summary chart with doctor/treatment filters |
| Patients | `/patients`, `/patients/add`, `/patients/:id` | Branch-scoped list with search and pagination; full profile editing; social/internal notes; Docs & Images uploads; clinical visits |
| Visits | Patient → Visits tab | Clinical note, treatment plan, treatment done (FDI tooth numbers), packages, prescriptions, instructions |
| Calendar | `/calendar` | Appointments by doctor and status, doctor unavailability, tasks |
| CRM | `/crm` | Patient Tracker (prospect → recall), enquiries, CSV enquiry upload, campaign quick-capture, opportunity pipeline, communication usage reports |
| Reports | `/reports` | Patient and appointment reports |
| Admin / Settings | `/admin`, `/settings` | Users and invites, roles and permissions, centres. Many other screens are not backed by tables yet (see below). |
| Help | `/help` | Placeholder ("Coming soon") |

The header branch selector scopes the Dashboard, patient lists, calendar and CRM to one centre. Staff only see the centres they are assigned to.

## Project structure

```
src/
  main.tsx                    entry point; initialises Sentry
  app/
    App.tsx                   Auth → Permission providers → router
    routes.ts                 all routes and route guards; pages are code-split (lazy-loaded)
    components/               Layout, Header, Sidebar, route guards, error boundary, ui/select
    context/                  AuthContext, BranchContext (selected centre)
    pages/
      Landing.tsx, Dashboard.tsx, Patients.tsx, PatientDetail.tsx, Calendar.tsx, CRM.tsx, Reports.tsx, …
      dashboard/              Practice Summary chart
      patient/                visits, documents, notes, edit-patient modal
      calendar/               calendar data layer and new-appointment modal
      crm/                    patient tracker, enquiries, opportunities, communication reports
      admin/, settings/       admin and settings screens
  lib/
    supabase.ts               Supabase client (requests pass through Sentry's monitored fetch)
    sentry.ts                 Sentry setup and Supabase error handler
    permissions/              role/permission provider, PermissionGate, pure access rules
  test/setup.ts               Vitest setup
supabase/                     NOT in git, see below
```

## Database

The live Supabase database is the source of truth for the schema. Before writing code against a table, check its real columns. Several screens were originally written against tables and columns that never existed.

**The `supabase/` folder is gitignored.** It exists only on the machine of whoever has been writing migrations. It holds:

- `migrations/020_…` to `026_…`: the most recent migrations (branch selector, Practice Summary, notes/documents, visits, CRM and Patient Tracker, demo workspace, demo sandbox). Earlier migrations (001–019) are not on disk; they were applied and their files removed.
- `VERIFY_MIGRATIONS.sql`: run it in the SQL editor to check that each migration's tables, policies and functions are present.
- `SCHEMA_GAPS.md`: tables the code expects that do not exist.
- `functions/invite-user/`: the Edge Function that creates accounts.

Add new migrations as numbered files (`025_….sql`), make them idempotent, and test them before running them in the Supabase SQL editor. Because the folder is untracked, deleting anything in it is unrecoverable.

### Key database pieces

- **RLS on every table.** Patient access goes through `can_access_patient()` and is scoped to the user's centres (`current_user_clinic_ids()`).
- **Permissions:** `current_user_has_permission(module, action)` backs both RLS policies and the in-app permission provider.
- **RPCs used by the app:** `my_branches`, `onboarding_branches`, `dashboard_stats`, `practice_summary`, `save_visit` (saves a visit with its treatments and prescriptions in one transaction), `patient_tracker`.
- **Storage:** private bucket `patient-files`, with files stored under `<patient_id>/…`. They are opened through short-lived signed URLs.

### Accounts

Sign-up is invite-only. An administrator invites staff from Settings → Users, which calls the `invite-user` Edge Function. The invitee sets a password at `/accept-invite`, then completes `/setup-profile`. Public sign-up must also stay disabled in Supabase → Authentication → Sign In / Providers; removing it from the UI alone does not close the API endpoint.

## Demo login

For demos, a separate **Dentosys Demo Clinic** branch holds sample data that always looks current (migration `025_demo_workspace.sql`):

1. Supabase → Authentication → Users → **Add user** (e.g. `demo@yourclinic.com`, with a password, auto-confirmed).
2. Run `025_demo_workspace.sql`, then `select public.setup_demo_user('demo@yourclinic.com');`.
3. Log in as that user.

The first time the demo workspace is opened each day, `refresh_demo_data()` rebuilds about five months of history plus last week, this week and next week around today's date (India time). Today's appointments move from Confirmed to Arrived, In Treatment and Completed as the day goes on. Anything added in the demo is cleared at the next daily rebuild, apart from patients.

The demo account is assigned only to the demo branch, so branch-level RLS keeps it away from real patients, and real staff never see demo data. New staff are never offered the demo branch during onboarding. To force a rebuild, run `update public.demo_state set refreshed_on = null;`.

### Public demo credentials

Set `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` (locally in `.env.local` and in Vercel) to show a **Try the live demo** panel on the login page, with the credentials and a one-click sign-in, and a **Try the live demo** button on the landing page.

Anyone can use a published password directly against the Supabase API, not just the website. So before publishing, run `026_public_demo_sandbox.sql`. It:

- adds a restrictive `demo_sandbox` policy to every public table, limiting the demo account to demo-branch rows (no real patients, staff profiles, CRM opportunities or campaigns);
- blocks the demo account from Storage uploads;
- locks its password and email with a trigger on `auth.users`.

Re-run its DO block whenever a new table is added. Changing the demo password then needs the SQL override documented at the bottom of the migration.

## Testing

```bash
npm test
```

Tests live next to the code they cover (`*.test.ts(x)`) and mock the Supabase client:

- `lib/permissions/access.test.ts`: permission and field-access rules
- `lib/permissions/PermissionGate.test.tsx`: gate rendering
- `app/context/BranchContext.test.tsx`: centre selection, cache reconciliation
- `lib/sentry.test.ts`: URL scrubbing and which Supabase errors get reported

## Error reporting

Set `VITE_SENTRY_DSN` to enable Sentry. The app handles patient records, so the setup in `src/lib/sentry.ts` is deliberately conservative:

- no session replay or performance tracing
- query strings are stripped from URLs
- request bodies, cookies and Postgres error details are never sent
- users are identified by id only

Every Supabase request goes through `monitoredFetch`. It reports server errors (5xx) and bug-type errors, such as a missing column or table or an invalid enum value. It does not report permission refusals or duplicate-entry errors. Crashes inside routes are caught by `RouteErrorBoundary`.

## Deployment

Deployed on Vercel (`vercel.json`): `vite build`, output `dist/`, and all paths rewritten to `index.html` for client-side routing. Set the environment variables above in the Vercel project.

## Current gaps

- **About 27 tables the code references do not exist** (treatments catalogue, labs, taxes, payment modes, vendors, equipment, inventory categories/transfers, clinic settings, accounting, SMS credits, …). The Admin and Settings screens built on them render empty. Create tables one feature at a time, with RLS policies.
- **Permissions are not enforced in the UI.** `PermissionGate` exists but is not used on pages, so any signed-in user can open every screen. RLS still protects the data that has policies.
- **Reports** ignore the selected branch.
- **Messaging** (SMS, WhatsApp, email) is not connected to any provider. The Communications reports only show recorded campaign rows.
- **Many older queries** treat errors as empty results (`data ?? []`), so a failing query looks like "no data". Sentry now reports these for code that goes through the Supabase client.
- **Some leftover sample data:** the Roles screen's user list and audit log, and the Calendar's fixed treatment, duration and status lists.

## Attributions

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) (shadcn/ui, Unsplash).
