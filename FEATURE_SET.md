# Current JJL Lawncare App Feature Set

## Public site

- Homepage, services, pricing, service area, contact, and terms pages
- Public quote request form
- Required customer/property information
- Service selection
- Yard condition details
- Preferred dates
- Customer notes
- Required quote photos upload
- Terms acceptance
- Server-side quote intake creates:
  - Customer
  - Property
  - Quote request
  - Terms acceptance record
  - Private uploaded quote photos
  - Activity log entry
- Address geocoding via Google Maps Geocoding API when configured

## Authentication and roles

- Supabase Auth login/signup
- Role-based app areas:
  - Admin
  - Crew
  - Customer
- Supabase RLS policies for:
  - Admin full access
  - Customers limited to owned records
  - Crew limited to assigned jobs
- New signup profile creation trigger
- Customer/profile linking by email migration

## Admin dashboard

- Operational summary cards for:
  - New quote requests
  - Sent estimates
  - Scheduled jobs
  - Unpaid invoices
  - Expenses
- Quick links for:
  - Create customer/account
  - Enter direct job
  - Plan mapped routes

## Admin customer/account management

- Create customer records
- Optionally create customer login accounts
- Add customer property/address
- Store access, gate, pet, hazard, yard-size notes
- Geocode property location
- Customer list
- Quick “create job” link per customer

## Quote request management

- Admin list of public quote requests
- View request detail
- Customer/property details
- Scope notes
- Status/risk indicators
- Private quote photo previews via signed URLs
- Create estimate from quote request

## Services and pricing

- Admin services list
- Create/edit/deactivate services
- Service metadata:
  - Category
  - Type: core, add-on, excluded, case-by-case
  - Pricing type
  - Min/max/base pricing
  - Unit label
  - Customer visibility
  - Parent approval/photo/site-review flags
  - Recurring capability

## Estimate workflow

- Create draft estimate from quote request
- Add line items
- Recalculate subtotal/tax/discount/total
- Edit scope included/excluded
- Customer/internal notes
- Send estimate
- Customer estimate list/detail
- Customer accepts sent estimates with typed name and checkbox
- Acceptance logs terms acceptance
- Accepted estimate can be converted to job

## Jobs workflow

- Convert accepted estimates into jobs
- Admin-entered direct jobs without public quote request
- Admin job list/detail
- Schedule date/time
- Assign crew
- Track status:
  - accepted
  - scheduled
  - on hold
  - on the way
  - in progress
  - completed
  - completed unpaid
  - paid
  - cancelled
- Job notes:
  - Tool notes
  - Safety notes
  - Internal notes
  - Customer-visible notes
- Checklist snapshot copied onto job
- Before/after job photo uploads
- Admin and crew can view job details

## Crew workflow

- Crew dashboard
- Assigned jobs list
- Assigned job detail
- View customer/property/job notes
- Update status to on the way / in progress
- Complete checklist items
- Required checklist validation before completion
- Mark job complete
- Upload before/after photos
- View assigned job map/directions

## Admin map and route planning

- Internal admin job map
- Google Maps embedded map support
- Job pins by status
- Scheduled route ordering
- Selected job detail panel
- Requested work attached to each map job
- Quote-request photos attached to job map details
- Route planning/pinpoint route button
- Google Maps route fallback link
- Unmapped job warning when coordinates are missing

## Invoices and payments

- Generate invoice from job/estimate
- Copy estimate line items to invoice
- Invoice number generation
- Payment instructions from settings
- Admin invoice list/detail
- Record payments:
  - Cash
  - Venmo
  - Other/manual
- Partial/full payment status
- Invoice balance recalculation
- Mark job paid when invoice is fully paid
- Optional payment proof image/PDF upload
- Customer invoice list/detail
- Customer payment instructions view

## Expenses and earnings

- Admin expense entry
- Job-linked or general expenses
- Expense categories
- Receipt image/PDF upload
- Reimbursement flag
- Expense list
- Earnings report:
  - Gross revenue
  - Job expenses
  - Equipment reserve
  - Tax/savings reserve
  - Distributable profit
  - Estimated equal crew payout split

## Settings

- Business/public settings
- Payment settings
- Document numbering/settings
- Tax/reserve settings
- Payment instruction configuration

## Checklists

- Admin checklist template CRUD
- Link templates to specific services or use general templates
- Add/update/deactivate checklist items
- Required/optional items
- Sort order
- Job conversion snapshots checklist state

## Terms

- Admin terms version CRUD
- Active terms version management
- Quote request requirement flag
- Estimate acceptance requirement flag
- Public `/terms` renders active terms version
- Terms acceptance records tied to customers/requests/documents

## Database/storage

- Supabase schema migrations
- RLS policies
- Seed data
- Private storage buckets:
  - quote-photos
  - job-photos
  - receipts
  - payment-proofs
  - settings-assets
- Scoped storage policies
- Combined `db/setup.sql` for dashboard SQL setup

## Demo data/accounts

Seeded demo roles:

```text
admin@jjllawn.local / JJLdemo123!
crew@jjllawn.local / JJLdemo123!
customer@jjllawn.local / JJLdemo123!
```

Demo data includes:

- Customer
- Property
- Quote request
- Estimate
- Scheduled job
- Invoice
- Payment
- Expense
- Services
- Checklists
- Terms
- Settings
