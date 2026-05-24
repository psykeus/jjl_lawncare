# JJL Lawn Services

Student Lawn Crew Manager implementation for the PRD in `jjl_lawn_crew_management_app_prd.md`.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS-style utility classes
- Supabase Auth, Postgres, Storage, and RLS
- Vercel-ready deployment

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in Supabase and Google Maps values in `.env.local`.

## Database setup

Apply migrations in order to a Supabase project, or paste/run `db/setup.sql` once in the Supabase SQL editor:

1. `db/migrations/001_initial_schema.sql`
2. `db/migrations/002_auth_rls.sql`
3. `db/migrations/003_link_customers_on_signup.sql`
4. `db/migrations/004_storage_buckets_policies.sql`
5. `db/migrations/005_service_areas.sql`
6. `db/migrations/006_service_questions.sql`
7. `db/migrations/007_scheduling_planning.sql`
8. `db/migrations/008_service_catalog_planning_fields.sql`
9. `db/migrations/009_tighten_expense_rls.sql`
10. `db/migrations/010_expand_upload_image_support.sql`
11. `db/seed/001_seed_defaults.sql`

The storage migrations create private Supabase Storage buckets for quote photos, job photos, receipts, payment proofs, and settings assets. Later migrations add managed service areas, service-specific intake questions, targeted upsells, service workload defaults, crew availability, route/schedule planning fields, tighter expense RLS, and expanded phone/browser image MIME support.

## Review seed data

To populate the online Supabase project with a complete fake review dataset around seven public/commercial addresses in the Anderson / 45255 area:

```bash
npm run seed:review-45255
```

The script creates fake admin/crew/customer auth users, seven mapped customer properties, quote requests, normalized service selections/answers/photos, estimates, jobs, invoices, payments, expenses, media records, crew availability, terms acceptances, and activity logs. It is idempotent for the `review.jjllawn.local` fake account domain and cleans/recreates that review dataset each run.

Default review login password:

```text
ReviewDemo123!
```

Suggested accounts:

```text
admin@review.jjllawn.local
jayden@review.jjllawn.local
avery.thompson@review.jjllawn.local
```

## Validation and QA

```bash
npm run typecheck
npm run lint
npm run build
npm run qa:rls
```

`qa:rls` loads `.env.local`, signs in with the seeded demo accounts, and checks representative public/customer/crew/admin RLS boundaries. Override demo credentials with the optional `DEMO_*` variables in `.env.local` if you rotate the seed accounts.

## Admin bootstrap

After creating your first user, promote them in Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Current implementation status

The MVP foundation and the first expansion pass are in place:

- Next.js app shell
- Public website pages backed by the admin service catalog
- Guided public quote request wizard
- Google Places address autocomplete support
- Service-area validation and admin service-area management
- Clickable service selection, targeted add-on upsells, service-specific questions, per-service notes, and per-service photo uploads
- Auth pages/actions with password and customer magic-link login
- Admin/customer/crew route groups
- Admin command center dashboard with grouped operational links, pipeline metrics, user/access analytics, and recent work queues
- Supabase schema/RLS/seed data
- Pricing and earnings calculation helpers
- Editable admin services/pricing/homepage/workload forms
- Admin service question and targeted upsell managers
- Editable admin settings forms
- Admin user management for creating users, changing roles/access rights, banning/unbanning accounts, and viewing user activity analytics
- Draft estimate builder with line items and totals
- Quote-request service answers/photos shown in admin request detail
- Customer estimate list/detail pages
- Customer estimate acceptance with terms acceptance logging
- Estimate-to-job conversion and admin scheduling
- Crew availability, schedule capacity board, route planner, and overbooking warnings
- Crew assigned job list/detail, checklist updates, status updates, and before/after photo uploads
- Invoice generation from jobs and cash/Venmo/manual payment recording
- Customer invoice/payment instruction pages
- Expense tracking and earnings split report
- Embedded admin Google map with current/queue/past pin groups and route controls
- Internal crew map/directions links
- Checklist template and item CRUD
- Terms version CRUD with public active terms page
- Private Supabase Storage bucket/policy migration

Recommended next development pass: add automated end-to-end browser tests for the quote wizard/admin scheduling flow and optionally deepen route optimization beyond the current deterministic planner with optional Google travel-time estimates.
