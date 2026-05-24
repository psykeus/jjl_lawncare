# Current JJL Lawncare App Feature Set

## Public site

- Homepage, services, pricing, service area, contact, and terms pages
- Homepage popular-service cards are driven by the admin service catalog and admin-managed featured/homepage fields
- Services page groups admin-managed services into core services, add-ons/upsells, case-by-case work, and exclusions
- Pricing page reads public pricing/ranges from admin-managed services
- Public quote request wizard with guided steps:
  - Address/service-area check
  - Clickable service selection
  - Add-on/upsell selection
  - Service-specific questions
  - Contact/timing/terms
- Required customer/property information
- Google Places address autocomplete when a browser Maps key is configured
- Service-area check before quote submission
- Service selection with support for preselecting a service from public service cards/pricing links
- Clickable core/case-by-case service cards inside the request form
- Add-on/upsell panel appears after a core service is selected
- Dynamic admin-created service questions render on the public request wizard
- Push-button answers for single-choice, multi-choice, and yes/no questions
- Short-text and number question support
- Notes per selected service
- Photo upload per selected service
- Required at least one quote photo per selected service, enforced server-side
- Preferred dates/time-window capture
- Customer notes
- Terms acceptance
- Server-side quote intake reuses/links existing customer profiles by signed-in session or matching email before creating request records
- Server-side quote intake creates:
  - Customer
  - Property
  - Quote request
  - Normalized selected quote-request services
  - Service-specific answer records
  - Service-specific photo link records
  - Terms acceptance record
  - Private uploaded quote photos
  - Activity log entry
- Address geocoding via Google Maps Geocoding API when configured
- In-area requests are accepted; outside-area requests are blocked with the configured outside-area message
- Customer request service/answer summary is copied into quote request notes for legacy admin views and map workflows

## Authentication and roles

- Full admin command center dashboard with grouped links for all admin tasks, operational metrics, recent queues, revenue/balance summaries, and user/access analytics
- Admin user management at `/admin/users` for creating login users, changing role/access rights, banning/unbanning via profile active state and Supabase Auth ban duration, and viewing sign-in/activity/job/customer analytics
- Live customer dashboard with recent requests, estimates, invoices, and jobs
- Customer request list/detail backed by live quote request data, selected services, answers, and private photo previews
- Customer property list backed by live property data
- Customer account settings update for name/phone
- Supabase Auth login/signup
- Passwordless/magic-link customer login option
- Auth callback supports a `next` redirect target
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
- Admin review controls for request status, risk level, internal notes, parent/admin approval requirement, and approval timestamp
- Customer/property details
- Scope notes
- Status/risk indicators
- Selected services section with per-service notes, answers, estimated workload/price hints, and linked photos
- Private quote photo previews via signed URLs
- Create estimate from quote request

## Services, pricing, and service intake questions

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
  - Homepage featured flag/title/summary/sort order
  - Estimated duration minutes
  - Default crew size
- Public homepage/services/pricing pages are tied to the admin service catalog
- Admin service-question manager at `/admin/services/[id]/questions`
- Add/edit/deactivate service-specific intake questions
- Public request wizard renders active service questions automatically
- Supported question types:
  - Single-choice buttons
  - Multi-choice buttons
  - Yes/no
  - Short text
  - Number
- Admin targeted upsell manager at `/admin/services/[id]/upsells`
- Add-on upsell choices can be linked to specific core services
- Public request wizard shows targeted add-on suggestions when selected core services have configured upsells
- Add/edit/deactivate button-answer options per question
- Service answer options can carry:
  - Price modifier
  - Duration/workload minute modifier
  - Risk modifier
  - Parent/admin approval flag
  - Sort order and active/inactive status
- Database support for normalized quote-request services, answers, and per-service photo linking
- Estimate creation can seed initial estimate line items from normalized quote-request service estimates

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
- Job planning fields:
  - Estimated duration minutes
  - Required crew size
  - Earliest start time
  - Latest end time
  - Route priority
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

- Live crew dashboard with today/open job counts, assigned job list, and rough paid-share summary
- Assigned jobs list
- Assigned job detail
- View customer/property/job notes
- Update status to on the way / in progress
- Complete checklist items
- Required checklist validation before completion
- Mark job complete
- Upload before/after photos
- View assigned job map/directions
- Live crew earnings page with paid revenue, expenses, reserves, and estimated per-job crew share

## Admin scheduling, route planning, and map

- Admin schedule board at `/admin/schedule`
- Admin route planner at `/admin/routes`
- Admin crew availability manager at `/admin/crew/availability`
- Crew availability records by date, start/end time, max hours, notes, and active status
- Daily schedule capacity calculations:
  - Crew capacity minutes
  - Job workload minutes
  - Travel buffer minutes
  - Remaining capacity
- Overbooking warnings when scheduled workload plus travel exceeds crew availability
- Crew-size warnings when a job needs more people than available at the planned work time
- Time-window warnings when the planned route exceeds latest-end constraints
- Deterministic route timeline using route priority, scheduled/window times, estimated duration, job coordinates, nearest-neighbor location ordering, and a travel buffer
- Optional Google Distance Matrix travel estimates for route legs when a server Google Maps key and API access are configured
- Potential same-day time-slot finder for new jobs using requested duration, required crew count, travel buffer, and remaining capacity
- Multi-day available slot finder at `/admin/schedule/slots`
- Planned route timeline shows crew available at each stop
- Route planner can open the ordered route in Google Maps
- Slot guidance based on remaining crew-minutes
- Internal admin job map
- Google Maps embedded map support
- Job pins grouped and color-coded by operational bucket:
  - Current jobs
  - Queue/upcoming jobs
  - Past jobs
- Filter controls for all/current/queue/past jobs
- Map jobs are filtered to the managed service area / Greater Cincinnati planning area
- Admin warning when jobs are outside the planning area and hidden from the routing map
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

## Service-area management

- Admin service-area manager at `/admin/service-areas`
- Supports service-area records by:
  - Map bounds
  - City allowlist
  - ZIP allowlist
  - Radius
  - Polygon/manual fallback metadata
- Default Greater Cincinnati planning area migration
- Configurable cities, ZIP codes, bounds, radius center, and outside-area message
- Service areas can be active/inactive and accepting requests/internal-only
- Public `/service-area` page lists active configured service areas
- API endpoint `/api/service-area/check` for request-form and planning checks
- Fallback Greater Cincinnati bounds/city checks if the database table is not yet applied

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
- Tightened expense read policy so customer accounts cannot read internal expense records through job access
- Seed data
- Service-area schema and policies
- Service-question/options schema and policies
- Service upsell schema and policies
- Quote-request service/answer/photo-link schema and policies
- Service catalog homepage/workload default columns
- Job scheduling/workload columns
- Crew availability schema and policies
- Private storage buckets:
  - quote-photos
  - job-photos
  - receipts
  - payment-proofs
  - settings-assets
- Scoped storage policies
- Combined `db/setup.sql` for dashboard SQL setup, now including service-area and service-question migrations

## Validation and QA

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run qa:rls` signs in with seeded demo users and verifies representative public, customer, crew, and admin RLS boundaries

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
