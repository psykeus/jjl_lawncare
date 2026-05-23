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

Apply migrations in order to a Supabase project:

1. `db/migrations/001_initial_schema.sql`
2. `db/migrations/002_auth_rls.sql`
3. `db/migrations/003_link_customers_on_signup.sql`
4. `db/migrations/004_storage_buckets_policies.sql`
5. `db/seed/001_seed_defaults.sql`

The storage migration creates private Supabase Storage buckets for quote photos, job photos, receipts, payment proofs, and settings assets.

## Admin bootstrap

After creating your first user, promote them in Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Current implementation status

Foundation is in place:

- Next.js app shell
- Public website pages
- Quote request server action
- Auth pages/actions
- Admin/customer/crew route groups
- Supabase schema/RLS/seed data
- Pricing and earnings calculation helpers
- Editable admin services/pricing forms
- Editable admin settings forms
- Draft estimate builder with line items and totals
- Customer estimate list/detail pages
- Customer estimate acceptance with terms acceptance logging
- Estimate-to-job conversion and admin scheduling
- Crew assigned job list/detail, checklist updates, status updates, and before/after photo uploads
- Invoice generation from jobs and cash/Venmo/manual payment recording
- Customer invoice/payment instruction pages
- Expense tracking and earnings split report
- Internal admin/crew location views with Google Maps links
- Checklist template and item CRUD
- Terms version CRUD with public active terms page
- Private Supabase Storage bucket/policy migration

Next development pass should run live Supabase migration/RLS checks, improve embedded map UX, add receipt/payment proof uploads, and add automated tests.
