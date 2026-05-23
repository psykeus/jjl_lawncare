# Student Lawn Crew Management App PRD

## 1. Product name

**Working title:** Student Lawn Crew Manager  
**Business use case:** Youth-run lawn maintenance and light yard cleanup business for Jayden, Jacob, and Liam.

---

## 2. Product summary

Student Lawn Crew Manager is a simple web application for managing a small student-run lawn and yard cleanup business. It allows customers to request service, accept terms, approve estimates, and view payment instructions. It allows the crew and parent/admin users to manage customers, properties, services, pricing, estimates, jobs, invoices, payments, expenses, earnings splits, and map-based job locations.

The product must remain intentionally simple. It should feel closer to a lightweight field-service notebook than a bloated CRM.

### Core outcome

The app should clearly answer:

1. Who is the customer?
2. Where is the job?
3. What service did they request?
4. What price was accepted?
5. What terms were accepted?
6. When is the job scheduled?
7. Has the job been completed?
8. Has payment been received?
9. How much did each crew member earn?

---

## 3. Goals

### Business goals

- Help the boys operate a safe, manageable summer lawn and yard cleanup business.
- Keep services within a youth-safe scope.
- Reduce confusion around pricing, scope, payments, and customer expectations.
- Make the business repeatable through clear packages and recurring jobs.
- Help them learn real business habits: quoting, scheduling, tracking, expenses, taxes, profit, and customer communication.

### Product goals

- Allow services, pricing, taxes, terms, and invoice settings to be editable by an admin.
- Provide a clean customer request and estimate approval flow.
- Provide a simple admin dashboard for managing jobs.
- Show job locations on a map.
- Track cash and Venmo payments without directly processing payments.
- Track expenses and calculate earnings splits.
- Store before/after job photos.
- Keep the app easy enough to build quickly and maintain cheaply.

---

## 4. Non-goals

The app should **not** attempt to be:

- A full landscaping business platform.
- A contractor marketplace.
- A full accounting system.
- A payroll system.
- A route-optimization platform.
- A card-payment processing system.
- A CRM with complex pipelines.
- A mobile-native app at MVP.
- A multi-company SaaS platform at MVP.

This is a small operational app for one student-run business.

---

## 5. Target users

## 5.1 Public visitor

A potential customer who wants to learn what services are offered and request a quote.

### Needs

- Understand what services are available.
- Understand approximate pricing.
- Know what work is excluded.
- Submit a simple quote request.

---

## 5.2 Customer

A homeowner or local resident requesting lawn or cleanup work.

### Needs

- Create or access a simple account.
- Add property information.
- Submit service request details and photos.
- Review and accept an estimate.
- Accept terms and conditions.
- View scheduled job details.
- See payment instructions for cash or Venmo.

---

## 5.3 Crew member

Jayden, Jacob, or Liam.

### Needs

- View assigned jobs.
- See job location on map.
- See service scope and notes.
- Use checklists.
- Upload before/after photos.
- Mark work progress.
- View earnings.

---

## 5.4 Parent/Admin

Responsible adult or designated business manager.

### Needs

- Manage services, prices, taxes, terms, and business settings.
- Approve risky or unusual jobs.
- Create and send estimates.
- Schedule jobs.
- Confirm payments.
- Track expenses.
- Review earnings splits.
- Manage customers and properties.
- Decline unsafe or out-of-scope jobs.

---

## 6. Recommended tech stack

The stack should optimize for low maintenance, easy development, and minimal infrastructure.

## 6.1 Frontend

**Next.js + TypeScript**

### Why

- Simple full-stack web app pattern.
- Good routing and server-side functionality.
- Strong TypeScript support.
- Easy deployment.
- Works well with Supabase.
- Can later be converted into a PWA-like mobile experience.

---

## 6.2 UI

**Tailwind CSS + shadcn/ui**

### Why

- Fast to build clean admin screens.
- Good reusable components.
- Avoids custom design overhead.
- Easy to keep consistent.

---

## 6.3 Backend/database/auth/storage

**Supabase Cloud**

Use:

- Supabase Postgres for database.
- Supabase Auth for customer/admin login.
- Supabase Storage for job photos.
- Supabase Row Level Security for access control.

### Why

- One service handles database, auth, storage, and APIs.
- Reduces backend complexity.
- Good enough for a small business app.
- Can be self-hosted later if desired, but cloud is the simplest first move.

---

## 6.4 Maps

**Google Maps Platform or Mapbox**

Use for:

- Address lookup/autocomplete.
- Geocoding addresses into map coordinates.
- Displaying job markers.

### Recommended MVP choice

Use **Google Maps Platform** if simplicity matters most. Address entry and map behavior are familiar to most users.

Use **Mapbox** if cost control and visual customization matter more.

The app should store latitude and longitude on the property record after geocoding.

---

## 6.5 Email

**Resend** or **Postmark**

Use for:

- Estimate sent notifications.
- Job scheduled notifications.
- Payment reminders.
- Customer account emails if needed.

MVP can start with copy/paste message templates and manual texts. Email automation can be added in V2.

---

## 6.6 Hosting

**Vercel**

### Why

- Easiest hosting path for Next.js.
- Low maintenance.
- Works well with Supabase.
- Suitable for a small operational app.

---

## 6.7 Optional future PWA

The app should be mobile-friendly from day one. A full mobile app is unnecessary.

Later, it can support:

- Add to Home Screen.
- Offline checklist caching.
- Push notifications.

Not MVP.

---

# 7. System principles

## 7.1 Keep configuration editable

Admins should be able to edit:

- Business name.
- Service area.
- Services.
- Service categories.
- Pricing rules.
- Add-ons.
- Taxes.
- Invoice wording.
- Estimate wording.
- Payment instructions.
- Venmo handle/QR instructions.
- Terms and conditions.
- Checklist templates.
- Risk flags.
- Crew members.
- Earnings split rules.

---

## 7.2 Keep the database lean

Avoid creating separate tables for every document type. Use a generic document model.

Example:

- Estimate = document with type `estimate`.
- Invoice = document with type `invoice`.
- Receipt = document with type `receipt`, optional later.

All use shared line items.

This keeps the system flexible without creating a monster schema.

---

## 7.3 Keep customer experience simple

Customers should not need to learn software.

They should be able to:

1. Submit request.
2. Upload photos.
3. Accept estimate.
4. Accept terms.
5. Pay cash or Venmo.

No unnecessary dashboard complexity.

---

## 7.4 Keep admin experience practical

The admin should not need to rebuild the business rules in code.

They should be able to update pricing, services, taxes, payment wording, and terms from the app.

---

# 8. Scope boundaries

## 8.1 In-scope services

The business and app should support only these service families:

1. Lawn mowing.
2. String trimming.
3. Blowing clippings.
4. Edging.
5. Weed pulling.
6. Flower bed cleanup.
7. Stick/branch cleanup from ground level.
8. Leaf cleanup.
9. Mulch spreading.
10. Patio/walkway sweeping.
11. Light yard debris bagging.
12. Limited flat-surface concrete pressure washing, later-phase only.
13. Light shed cleanout, parent/admin-approved only.
14. Dog waste cleanup, separate service only.

---

## 8.2 Out-of-scope services

The app should allow admins to display excluded services publicly.

Excluded by default:

- Tree trimming.
- Chainsaw work.
- Ladder work.
- Roof work.
- Gutter cleaning.
- Chemical weed killer.
- Fertilizer programs.
- Pesticide application.
- Major hauling.
- Dump runs.
- Hazardous material cleanup.
- Mold cleanup.
- Unknown trash cleanup.
- Heavy construction.
- Retaining walls.
- Drainage work.
- House siding pressure washing.
- Deck pressure washing.

---

# 9. Core product modules

## 9.1 Public website

### Purpose

Explain the service clearly and collect quote requests.

### Pages

1. Home.
2. Services.
3. Pricing.
4. Service Area.
5. Request Quote.
6. Terms.
7. Contact.

### Requirements

- Admin-editable headline.
- Admin-editable service descriptions.
- Admin-editable pricing ranges.
- Admin-editable excluded services.
- Quote request call-to-action.
- Mobile-friendly design.

---

## 9.2 Customer account

### Purpose

Allow customers to manage requests, estimates, terms acceptance, and payment instructions.

### Features

- Sign up/login.
- Add customer contact details.
- Add property.
- Submit quote request.
- Upload photos.
- View estimate.
- Accept or decline estimate.
- Accept terms.
- View scheduled job.
- View invoice/payment instructions.

### Customer account should not include

- Complex CRM features.
- Messaging inbox at MVP.
- Card payment processing.
- Multi-property complexity beyond simple property records.

---

## 9.3 Admin dashboard

### Purpose

Central command center for parent/admin and crew management.

### Dashboard cards

- New quote requests.
- Estimates awaiting customer approval.
- Jobs scheduled this week.
- Jobs needing parent approval.
- Completed unpaid jobs.
- Revenue this week.
- Expenses this week.
- Estimated crew earnings.

### Filters

- Date range.
- Service type.
- Job status.
- Payment status.
- Customer.
- Crew member.
- Risk level.

---

## 9.4 Service catalog manager

### Purpose

Allow admin to manage services without code changes.

### Editable service fields

- Service name.
- Service category.
- Public description.
- Internal description.
- Active/inactive.
- Customer-visible yes/no.
- Base price.
- Minimum price.
- Unit type.
- Default checklist.
- Requires parent approval yes/no.
- Requires photos yes/no.
- Requires site review yes/no.
- Is recurring-capable yes/no.
- Sort order.

### Service categories

Default categories:

- Lawn mowing.
- Yard cleanup.
- Bed cleanup.
- Mulch.
- Seasonal cleanup.
- Case-by-case.

Admins can rename, activate, deactivate, and reorder categories.

---

## 9.5 Pricing manager

### Purpose

Make pricing flexible without making the system complex.

### Pricing types

Each service can use one of these pricing methods:

1. Flat price.
2. Price range.
3. Per crew-hour.
4. Per unit.
5. Per cubic yard.
6. Custom estimate only.

### Pricing fields

- Base price.
- Minimum price.
- Maximum guide price.
- Unit label.
- Default quantity.
- Customer-visible range.
- Internal notes.

### Add-on pricing

Admins can define add-ons such as:

- Edging.
- Extra trimming.
- Overgrown grass surcharge.
- Stick pickup.
- Bagging debris.
- Weed-heavy surcharge.
- Wet grass surcharge.
- Dog waste cleanup.
- Gate/access difficulty.

### Add-on fields

- Add-on name.
- Service category.
- Price type.
- Default price.
- Minimum price.
- Customer-visible yes/no.
- Requires approval yes/no.

---

## 9.6 Tax/settings manager

### Purpose

Allow taxes and reserves to be managed without code changes.

### Tax settings

- Sales tax enabled yes/no.
- Sales tax rate.
- Tax name.
- Apply tax to services yes/no.
- Apply tax to materials yes/no.
- Tax note for invoices.

### Business reserve settings

- Equipment reserve percentage.
- Tax/savings reserve percentage.
- Default split method.

### Default suggested values

- Equipment reserve: 10%.
- Tax/savings reserve: 15%.
- Split method: equal among assigned crew members.

### Important note

The app should track tax and reserve amounts, but it should not claim to provide tax advice.

---

## 9.7 Quote request manager

### Purpose

Capture customer job requests and convert them into estimates.

### Customer request fields

- Customer name.
- Email.
- Phone.
- Address.
- Property type.
- Service requested.
- Yard size.
- Grass height.
- Debris present.
- Dog waste present.
- Pets present.
- Gate/access notes.
- Slope/terrain notes.
- Preferred dates.
- Photos.
- Customer notes.
- Terms accepted.

### Request statuses

- New.
- Needs review.
- Needs more info.
- Site review needed.
- Estimate drafted.
- Estimate sent.
- Converted to job.
- Declined.
- Archived.

---

## 9.8 Estimate builder

### Purpose

Create clear, editable customer estimates.

### Estimate requirements

- Linked customer.
- Linked property.
- Linked quote request, optional.
- Expiration date.
- Service line items.
- Add-on line items.
- Discount line items, optional.
- Tax line, if enabled.
- Total amount.
- Scope included.
- Scope excluded.
- Terms version.
- Customer approval status.

### Estimate actions

- Create draft.
- Add line item from service catalog.
- Add custom line item.
- Apply tax settings.
- Preview customer version.
- Send estimate.
- Revise estimate.
- Mark accepted.
- Mark declined.
- Convert to job.
- Convert to invoice.

### Estimate statuses

- Draft.
- Sent.
- Viewed.
- Accepted.
- Declined.
- Expired.
- Revised.
- Converted.

---

## 9.9 Invoice manager

### Purpose

Create simple invoices for accepted/completed jobs.

### Invoice requirements

- Linked customer.
- Linked property.
- Linked job.
- Invoice number.
- Invoice date.
- Due date.
- Line items.
- Tax line, if enabled.
- Total due.
- Payment instructions.
- Payment status.

### Invoice statuses

- Draft.
- Sent.
- Unpaid.
- Partially paid.
- Paid.
- Cancelled.

### Invoice numbering

Admin-configurable:

- Prefix, default `JLC-`.
- Starting number.
- Auto-increment enabled yes/no.

Example:

- JLC-0001
- JLC-0002

---

## 9.10 Terms and conditions manager

### Purpose

Allow admins to edit legal/customer terms and track acceptance.

### Terms requirements

- Terms title.
- Version number.
- Effective date.
- Terms body.
- Active/inactive.
- Required for quote request yes/no.
- Required for estimate acceptance yes/no.

### Terms acceptance record

Track:

- Customer.
- Property.
- Estimate or job.
- Terms version.
- Accepted timestamp.
- Name typed by customer.
- Checkbox acceptance.
- Optional IP/device metadata.

### Default terms topics

- Payment due upon completion.
- Customer must clear yard before service.
- Pets must be secured.
- Hidden objects are customer responsibility.
- Weather may delay service.
- Unsafe jobs may be declined.
- No chemical application.
- No ladder/roof/tree work.
- Before/after photos may be used for job documentation.
- Customer information will not be publicly shared.

---

## 9.11 Job manager

### Purpose

Manage accepted work from scheduling through completion.

### Job fields

- Customer.
- Property.
- Estimate.
- Invoice.
- Service type.
- Scheduled date.
- Scheduled time window.
- Assigned crew.
- Job status.
- Payment status.
- Internal notes.
- Customer-visible notes.
- Required tools.
- Risk flags.
- Checklist.
- Before photos.
- After photos.
- Completion notes.

### Job statuses

- Accepted.
- Scheduled.
- On hold.
- On the way.
- In progress.
- Completed.
- Completed unpaid.
- Paid.
- Cancelled.
- Declined.

### Job actions

- Schedule.
- Assign crew.
- Update status.
- Upload photos.
- Complete checklist.
- Generate invoice.
- Mark payment pending.
- Mark paid.
- Reschedule.
- Cancel.

---

## 9.12 Checklist manager

### Purpose

Make jobs repeatable and reduce missed steps.

### Checklist templates

Admin can create/edit checklist templates by service.

### Default mowing checklist

- Yard checked for objects.
- Pets secured.
- Before photos taken.
- Mowed.
- Trimmed.
- Edged, if included.
- Clippings blown.
- After photos taken.
- Customer notified.
- Payment collected or marked pending.

### Default cleanup checklist

- Scope reviewed.
- PPE used.
- Unsafe items checked.
- Before photos taken.
- Debris collected.
- Bags staged.
- Area swept.
- After photos taken.
- Customer notified.
- Payment collected or marked pending.

---

## 9.13 Map view

### Purpose

Help the crew understand job locations, clusters, and route planning.

### Map requirements

- Show customer property locations.
- Show markers by job/request status.
- Filter by date.
- Filter by job status.
- Filter by payment status.
- Filter by service type.
- Show estimated job amount on marker hover/click.
- Show customer name and address on marker click for authorized users.
- Open job details from marker.

### Marker statuses

- New request.
- Estimate sent.
- Accepted.
- Scheduled.
- In progress.
- Completed unpaid.
- Paid.
- Declined.
- Parent review required.

### Privacy rule

Public users must never see customer map locations. Map is internal only.

---

## 9.14 Payment tracker

### Purpose

Track cash and Venmo payments without processing payments directly.

### Payment methods

- Cash.
- Venmo.
- Other/manual, optional.

### Payment fields

- Invoice/job.
- Amount due.
- Amount received.
- Payment method.
- Payment status.
- Confirmed by.
- Date received.
- Notes.
- Optional payment screenshot/photo.

### Payment statuses

- Unpaid.
- Cash pending.
- Venmo pending.
- Partially paid.
- Paid.
- Problem.
- Refunded, optional later.

### Venmo instructions

Admin can configure:

- Venmo handle.
- Venmo display name.
- Venmo QR image.
- Payment note template.

Example payment note template:

`Lawn service - {customer_last_name} - {invoice_number}`

---

## 9.15 Expense tracker

### Purpose

Track basic business expenses and reimbursements.

### Expense categories

Admin-editable defaults:

- Gas.
- Trimmer string.
- Trash bags.
- Gloves.
- Tools.
- Mower maintenance.
- Oil.
- Repairs.
- Drinks/water.
- Transportation.
- Materials.
- Other.

### Expense fields

- Date.
- Category.
- Amount.
- Paid by.
- Related job, optional.
- Receipt/photo, optional.
- Reimbursed yes/no.
- Notes.

---

## 9.16 Earnings split calculator

### Purpose

Calculate fair payout after expenses, reserves, and tax/savings allocation.

### Inputs

- Job revenue.
- Job-specific expenses.
- Equipment reserve percentage.
- Tax/savings reserve percentage.
- Assigned crew members.
- Custom adjustments.

### Calculation flow

1. Gross revenue.
2. Subtract job-specific expenses.
3. Calculate equipment reserve.
4. Calculate tax/savings reserve.
5. Calculate remaining distributable profit.
6. Split among assigned crew.
7. Show payout per crew member.

### Split methods

Admin-configurable:

- Equal split among assigned crew.
- Custom percentage split.
- Fixed payout per crew member.

MVP default: equal split among assigned crew.

---

## 9.17 Risk flagging

### Purpose

Prevent the crew from accepting unsafe or out-of-scope work.

### Default risk flags

- Overgrown yard.
- Dog waste present.
- Aggressive dog/pet risk.
- Shed cleanout.
- Unknown trash.
- Pressure washing.
- Customer requests excluded service.
- Large cleanup.
- Job outside service area.
- Requires parent approval.
- Weather risk.
- Equipment risk.

### Risk levels

- Low.
- Medium.
- High.
- Decline.

### Required behavior

High-risk jobs require parent/admin approval before estimate can be sent.

Decline-risk jobs should not be accepted unless admin overrides.

---

## 9.18 Message templates

### Purpose

Allow fast customer communication without building a complex messaging system.

### Template types

- Quote request received.
- Need more photos.
- Estimate sent.
- Estimate accepted.
- Job scheduled.
- Weather delay.
- Job completed.
- Payment reminder.
- Out-of-scope decline.

### Template fields

- Template name.
- Channel: email/text/manual.
- Subject, if email.
- Message body.
- Active/inactive.

### MVP behavior

Templates can be copied manually.

Automated sending can be V2.

---

# 10. Admin configuration

The app must include a settings area.

## 10.1 Business settings

Editable fields:

- Business name.
- Logo.
- Contact email.
- Contact phone.
- Service area description.
- Home/base address, internal only.
- Public website intro text.
- Public footer text.
- Business status: active/paused.

---

## 10.2 Payment settings

Editable fields:

- Accept cash yes/no.
- Accept Venmo yes/no.
- Venmo handle.
- Venmo QR image.
- Cash payment instructions.
- Payment due wording.
- Late payment wording.

---

## 10.3 Document settings

Editable fields:

- Estimate prefix.
- Invoice prefix.
- Starting number.
- Default estimate expiration days.
- Default invoice due days.
- Estimate footer note.
- Invoice footer note.

---

## 10.4 Tax/reserve settings

Editable fields:

- Sales tax enabled.
- Sales tax rate.
- Sales tax label.
- Apply tax to labor.
- Apply tax to materials.
- Equipment reserve percentage.
- Tax/savings reserve percentage.

---

## 10.5 Service settings

Editable fields:

- Service categories.
- Services.
- Add-ons.
- Excluded services.
- Checklist templates.
- Risk rules.

---

# 11. Permissions and access control

## 11.1 Roles

### Public

Can:

- View public pages.
- Submit quote request.

Cannot:

- View customer data.
- View map.
- View jobs.

---

### Customer

Can:

- View own profile.
- View own properties.
- View own quote requests.
- View own estimates.
- Accept/decline own estimates.
- Accept terms.
- View own invoices/payment instructions.

Cannot:

- View other customers.
- View internal notes.
- View crew earnings.
- View map.

---

### Crew

Can:

- View assigned jobs.
- View job map.
- Update job checklist.
- Upload job photos.
- Add job notes.
- Mark job complete, if permitted.

Cannot:

- Edit pricing settings.
- Edit terms.
- Confirm payments unless allowed.
- Delete customers.
- Change tax settings.

---

### Admin

Can:

- Full system access.
- Manage settings.
- Manage services/pricing.
- Manage customers.
- Send estimates.
- Confirm payments.
- Approve risky jobs.
- View reports.

---

## 11.2 Parent approval

Parent/admin approval should be required for:

- High-risk jobs.
- Jobs above configurable dollar threshold.
- Case-by-case services.
- Shed cleanouts.
- Pressure washing.
- Dog waste cleanup.
- Out-of-service-area jobs.

Default threshold: jobs over $225 require admin approval.

---

# 12. Data model

The schema should be small and flexible.

## 12.1 Recommended tables

1. `profiles`
2. `customers`
3. `properties`
4. `service_categories`
5. `services`
6. `quote_requests`
7. `documents`
8. `document_items`
9. `jobs`
10. `payments`
11. `expenses`
12. `media_files`
13. `terms_versions`
14. `terms_acceptances`
15. `checklist_templates`
16. `checklist_items`
17. `settings`
18. `activity_log`

This is enough. Do not create 40 tables for a three-person lawn crew.

---

## 12.2 Table summaries

## `profiles`

Stores app users.

Fields:

- id
- auth_user_id
- name
- email
- phone
- role
- active
- created_at
- updated_at

---

## `customers`

Stores customer contact records.

Fields:

- id
- profile_id, optional
- name
- email
- phone
- notes
- status
- created_at
- updated_at

---

## `properties`

Stores customer job locations.

Fields:

- id
- customer_id
- address_line_1
- address_line_2
- city
- state
- zip
- latitude
- longitude
- gate_notes
- pet_notes
- hazard_notes
- yard_size
- access_notes
- active
- created_at
- updated_at

---

## `service_categories`

Stores editable service groups.

Fields:

- id
- name
- description
- sort_order
- active
- created_at
- updated_at

---

## `services`

Stores editable services and add-ons.

Fields:

- id
- category_id
- name
- public_description
- internal_description
- service_type: core/add_on/excluded/case_by_case
- pricing_type
- base_price
- min_price
- max_price
- unit_label
- visible_to_customer
- requires_parent_approval
- requires_photos
- requires_site_review
- recurring_capable
- active
- sort_order
- created_at
- updated_at

---

## `quote_requests`

Stores customer requests before estimate.

Fields:

- id
- customer_id
- property_id
- requested_service_id
- status
- yard_size
- grass_height
- debris_present
- dog_waste_present
- pets_present
- gate_access
- preferred_dates
- customer_notes
- internal_notes
- risk_level
- parent_approval_required
- terms_accepted_at
- created_at
- updated_at

---

## `documents`

Stores estimates and invoices.

Fields:

- id
- document_type: estimate/invoice
- document_number
- customer_id
- property_id
- quote_request_id
- job_id, optional
- status
- issue_date
- expiration_date
- due_date
- subtotal
- discount_total
- tax_total
- total
- amount_paid
- balance_due
- scope_included
- scope_excluded
- customer_notes
- internal_notes
- payment_instructions
- terms_version_id
- accepted_at
- declined_at
- created_at
- updated_at

---

## `document_items`

Stores line items for estimates and invoices.

Fields:

- id
- document_id
- service_id, optional
- item_type: service/add_on/material/discount/tax/custom
- description
- quantity
- unit_label
- unit_price
- line_total
- taxable
- sort_order
- created_at
- updated_at

---

## `jobs`

Stores scheduled/completed work.

Fields:

- id
- customer_id
- property_id
- estimate_id
- invoice_id
- status
- scheduled_date
- scheduled_start_time
- scheduled_end_time
- assigned_crew_ids
- checklist_snapshot
- tool_notes
- safety_notes
- internal_notes
- customer_visible_notes
- completed_at
- created_at
- updated_at

Note: `assigned_crew_ids` can be a simple array for MVP. If crew assignments become more complex later, split into a separate table.

---

## `payments`

Stores payment records.

Fields:

- id
- document_id
- job_id
- amount
- method: cash/venmo/other
- status
- confirmed_by
- received_at
- notes
- created_at
- updated_at

---

## `expenses`

Stores business expenses.

Fields:

- id
- job_id, optional
- category
- amount
- paid_by
- expense_date
- reimbursed
- notes
- created_at
- updated_at

---

## `media_files`

Stores uploaded photos and documents.

Fields:

- id
- related_type: quote_request/job/payment/expense/property
- related_id
- file_url
- file_type
- label: before/after/receipt/payment/photo/other
- uploaded_by
- created_at

---

## `terms_versions`

Stores editable terms.

Fields:

- id
- title
- version
- body
- effective_date
- active
- required_for_quote_request
- required_for_estimate_acceptance
- created_at
- updated_at

---

## `terms_acceptances`

Stores customer acceptance records.

Fields:

- id
- customer_id
- property_id
- quote_request_id, optional
- document_id, optional
- terms_version_id
- accepted_name
- accepted_at
- ip_address, optional
- user_agent, optional
- created_at

---

## `checklist_templates`

Stores reusable job checklists.

Fields:

- id
- name
- service_id, optional
- active
- created_at
- updated_at

---

## `checklist_items`

Stores checklist template items.

Fields:

- id
- checklist_template_id
- label
- required
- sort_order
- active

---

## `settings`

Stores flexible app settings.

Fields:

- id
- key
- value_json
- updated_by
- updated_at

Use this for business settings, payment settings, document prefixes, tax settings, and feature flags.

---

## `activity_log`

Stores important system events.

Fields:

- id
- actor_id
- action
- related_type
- related_id
- metadata_json
- created_at

---

# 13. Primary workflows

## 13.1 Customer quote request flow

1. Customer visits website.
2. Customer selects request quote.
3. Customer enters contact/property details.
4. Customer selects service.
5. Customer answers scope questions.
6. Customer uploads photos.
7. Customer accepts request terms.
8. System creates customer/property/request records.
9. Admin receives new request notification.
10. Request appears on dashboard and map.

### Acceptance criteria

- Customer cannot submit without required fields.
- Customer cannot submit without terms acceptance.
- Admin can view request details and photos.
- Property can be mapped if address is geocoded.

---

## 13.2 Admin estimate flow

1. Admin opens quote request.
2. Admin reviews scope, photos, location, and risk flags.
3. Admin creates estimate.
4. Admin adds service line items.
5. Admin adds add-ons/surcharges if needed.
6. App calculates subtotal, tax, total.
7. Admin writes included/excluded scope.
8. Admin previews customer version.
9. Admin sends estimate.
10. Customer receives estimate link.

### Acceptance criteria

- Estimate can include service catalog items and custom line items.
- Estimate total updates when line items change.
- Estimate uses current tax settings.
- Estimate records terms version.
- Estimate cannot be sent if required parent approval is missing.

---

## 13.3 Customer estimate acceptance flow

1. Customer opens estimate.
2. Customer reviews service, scope, price, and exclusions.
3. Customer accepts terms.
4. Customer clicks accept estimate.
5. System marks estimate accepted.
6. Admin is notified.
7. Job can now be scheduled.

### Acceptance criteria

- Customer cannot accept without terms checkbox/name.
- Acceptance timestamp is stored.
- Estimate status changes to accepted.
- Terms acceptance record is created.

---

## 13.4 Job scheduling flow

1. Admin opens accepted estimate.
2. Admin converts estimate to job.
3. Admin selects scheduled date/time window.
4. Admin assigns crew.
5. Admin confirms checklist.
6. Job appears on dashboard, calendar, and map.
7. Customer can view scheduled job.

### Acceptance criteria

- Job inherits customer, property, estimate, service scope, and checklist.
- Job marker appears on map.
- Crew can see assigned job.

---

## 13.5 Job completion flow

1. Crew opens job.
2. Crew reviews scope and safety notes.
3. Crew takes before photos.
4. Crew completes checklist.
5. Crew takes after photos.
6. Crew adds completion notes.
7. Crew marks job completed.
8. Admin generates or confirms invoice.
9. Payment is collected or marked pending.

### Acceptance criteria

- Required checklist items must be completed before job can be marked complete, unless admin override.
- Before/after photos can be uploaded.
- Job status updates correctly.

---

## 13.6 Payment flow

1. Customer pays by cash or Venmo.
2. Crew marks payment as pending if needed.
3. Parent/admin confirms payment received.
4. App updates invoice balance.
5. App marks invoice paid when balance is zero.
6. Earnings split is calculated.

### Acceptance criteria

- Payments can be partial or full.
- Payment method is recorded.
- Only authorized users can confirm payment.
- Paid status updates document/job.

---

## 13.7 Expense and payout flow

1. Admin or crew logs expense.
2. Expense can be linked to a job or general business.
3. Payment is confirmed for completed job.
4. App calculates job profit.
5. App applies reserves.
6. App calculates crew split.
7. Admin can mark payout as handled, optional later.

### Acceptance criteria

- Job-specific expenses reduce job profit.
- Equipment reserve is calculated from configured percentage.
- Tax/savings reserve is calculated from configured percentage.
- Crew split uses assigned crew list.

---

# 14. Page/screen list

## Public pages

1. Home.
2. Services.
3. Pricing.
4. Service Area.
5. Request Quote.
6. Terms.
7. Contact.

---

## Customer pages

1. Customer login/signup.
2. Customer dashboard.
3. My properties.
4. New quote request.
5. Request detail.
6. Estimate detail.
7. Invoice/payment detail.
8. Account settings.

---

## Crew pages

1. Crew dashboard.
2. My jobs.
3. Job detail.
4. Job checklist.
5. Map.
6. Earnings summary.

---

## Admin pages

1. Admin dashboard.
2. Customers.
3. Customer detail.
4. Properties.
5. Quote requests.
6. Estimate builder.
7. Jobs.
8. Calendar.
9. Map.
10. Invoices.
11. Payments.
12. Expenses.
13. Earnings report.
14. Services manager.
15. Pricing/add-ons manager.
16. Checklist manager.
17. Terms manager.
18. Message templates.
19. Settings.
20. Activity log.

---

# 15. Reporting

## 15.1 Dashboard summary

Show:

- Revenue this week.
- Revenue this month.
- Expenses this week.
- Unpaid invoice total.
- Jobs completed.
- Jobs scheduled.
- New requests.
- Estimated crew payouts.

---

## 15.2 Job profitability report

Show:

- Job total.
- Expenses.
- Net profit.
- Crew hours, optional.
- Net dollars per crew-hour.
- Crew payout.

This is the most important learning metric.

---

## 15.3 Customer report

Show:

- New customers.
- Repeat customers.
- Top customers by revenue.
- Customers with unpaid balances.

---

## 15.4 Service report

Show:

- Revenue by service.
- Number of jobs by service.
- Average job value.
- Most profitable services.

---

# 16. MVP requirements

## Must have

- Public website.
- Customer quote request form.
- Customer login/account.
- Admin dashboard.
- Service/pricing manager.
- Quote request manager.
- Estimate builder.
- Terms acceptance.
- Job scheduling.
- Job status tracking.
- Map view.
- Invoice generation.
- Cash/Venmo payment tracking.
- Expense tracking.
- Earnings split calculation.
- Before/after photo uploads.
- Role-based access.

---

## Should have

- Message templates.
- Calendar view.
- Recurring mowing flag.
- Parent approval rules.
- Risk flags.
- Simple reports.
- Venmo QR image display.

---

## Could have later

- Automated email sending.
- SMS integration.
- Route optimization.
- Weather integration.
- PWA offline mode.
- Review/testimonial collection.
- Customer referral tracking.
- Export to CSV.
- Full accounting export.

---

## Not MVP

- Card payments.
- Payroll processing.
- Advanced tax filing.
- Multi-business accounts.
- Native mobile app.
- AI pricing assistant.
- Complex inventory.
- Contractor marketplace features.

---

# 17. Default seed data

The app should ship with editable starter data.

## 17.1 Service categories

- Lawn mowing.
- Yard cleanup.
- Bed cleanup.
- Mulch.
- Seasonal cleanup.
- Case-by-case.

---

## 17.2 Starter services

### Basic Cut

- Category: Lawn mowing.
- Pricing type: range.
- Min price: $35.
- Max price: $110.
- Customer visible: yes.

### Clean Cut

- Category: Lawn mowing.
- Pricing type: range.
- Min price: $50.
- Max price: $140.
- Customer visible: yes.

### Yard Reset

- Category: Yard cleanup.
- Pricing type: custom estimate.
- Minimum price: $75.
- Customer visible: yes.

### Mulch Refresh

- Category: Mulch.
- Pricing type: per cubic yard.
- Min price: $75.
- Max price: $125.
- Customer visible: yes.

### Flat Concrete Pressure Washing

- Category: Case-by-case.
- Pricing type: custom estimate.
- Minimum price: $75.
- Requires parent approval: yes.
- Customer visible: optional.

---

## 17.3 Starter add-ons

- Edging.
- Overgrown grass surcharge.
- Stick pickup.
- Extra weed pulling.
- Debris bagging.
- Dog waste cleanup.
- Wet grass surcharge.
- Gate/access difficulty.

---

## 17.4 Starter excluded services

- Tree trimming.
- Chainsaw work.
- Roof/gutter work.
- Ladder work.
- Chemical weed killer.
- Fertilizer/pesticide application.
- Heavy hauling.
- Hazardous cleanup.
- House siding pressure washing.
- Deck pressure washing.

---

# 18. Business rules

## 18.1 Estimate rules

- Estimate must have at least one line item.
- Estimate must have a total greater than $0.
- Estimate must include scope included/excluded fields.
- Estimate cannot be accepted without terms acceptance.
- Estimate expiration defaults to configurable setting.

---

## 18.2 Job rules

- Job must be linked to customer and property.
- Job should normally be linked to an accepted estimate.
- High-risk jobs require parent/admin approval.
- Job cannot be marked paid unless payment is confirmed.
- Job completion should require checklist completion.

---

## 18.3 Payment rules

- Payment can be cash or Venmo.
- Payment confirmation requires admin or authorized role.
- Partial payments are allowed.
- Invoice balance updates after payment.
- Future service can be blocked for unpaid customers, optional setting.

---

## 18.4 Tax/reserve rules

- Tax calculation uses current settings at document creation.
- Existing accepted documents should not automatically change if tax settings change later.
- Equipment reserve and tax/savings reserve use settings active at payout calculation time, unless locked.

---

## 18.5 Customer data rules

- Customers can only view their own records.
- Public visitors cannot view map or customer/job data.
- Crew can only view assigned jobs unless admin allows all-job visibility.

---

# 19. Security and privacy

## 19.1 Authentication

Use Supabase Auth.

Supported login options:

- Email/password.
- Magic link, optional.

MVP recommendation:

- Admin/crew: email/password.
- Customer: magic link or email/password.

---

## 19.2 Authorization

Use role-based access:

- Public.
- Customer.
- Crew.
- Admin.

Supabase Row Level Security should enforce:

- Customers only access own data.
- Crew only access assigned operational data.
- Admin can access all data.

---

## 19.3 Privacy

The app stores customer addresses, phone numbers, and job photos. Treat this as private operational data.

Public pages must never expose:

- Customer addresses.
- Map markers.
- Private photos.
- Payment data.
- Crew earnings.

---

# 20. Design requirements

## 20.1 Design style

- Clean.
- Mobile-first.
- Large buttons.
- Simple forms.
- Minimal navigation.
- Clear status labels.
- Strong contrast.

---

## 20.2 Customer UX principles

- Keep quote request short.
- Ask only fields that affect quoting or safety.
- Use plain language.
- Avoid contractor jargon.
- Make price and scope obvious.

---

## 20.3 Crew UX principles

- Jobs should be easy to open from phone.
- Map should be fast.
- Checklist should be tap-friendly.
- Photos should upload easily.
- Payment status should be obvious.

---

# 21. Acceptance criteria by module

## 21.1 Public website

- User can view active services.
- User can view basic pricing ranges.
- User can submit quote request.
- User must accept terms before submitting.

---

## 21.2 Admin service manager

- Admin can create/edit/deactivate service.
- Admin can set pricing type and price values.
- Admin can mark services customer-visible or internal-only.
- Service changes do not break old estimates/invoices.

---

## 21.3 Estimate builder

- Admin can create estimate from quote request.
- Admin can add service line items.
- Admin can add custom line items.
- System calculates totals.
- Customer can accept estimate.
- Terms acceptance is recorded.

---

## 21.4 Job manager

- Admin can convert accepted estimate to job.
- Admin can schedule job.
- Crew can view assigned job.
- Crew can complete checklist.
- Crew can upload before/after photos.
- Job can be marked completed.

---

## 21.5 Payment tracker

- Admin can record cash payment.
- Admin can record Venmo payment.
- Payment updates invoice balance.
- Invoice status changes to paid when balance reaches zero.

---

## 21.6 Map

- Admin/crew can view job markers.
- Markers show status.
- Marker click opens job/property summary.
- Public/customer users cannot access internal map.

---

## 21.7 Earnings split

- System calculates reserves.
- System subtracts expenses.
- System splits remaining profit among assigned crew.
- Admin can review payout summary.

---

# 22. Future enhancements

## V2

- Automated email notifications.
- Calendar view.
- Recurring mowing schedules.
- Route clustering.
- CSV export.
- Customer rebook button.
- Weather delay templates.

## V3

- SMS notifications.
- Referral tracking.
- Review/testimonial collection.
- PWA install mode.
- Offline job checklist.
- Basic route optimization.

## V4

- Optional card payments.
- Accounting export.
- Customer subscription/recurring payment options.
- Multi-season service packages.

---

# 23. Development approach

## Phase 1: Foundation

- Set up Next.js app.
- Set up Supabase project.
- Create auth and roles.
- Create core tables.
- Create public website shell.
- Create admin dashboard shell.

## Phase 2: Customer intake

- Quote request form.
- Customer/property creation.
- Photo upload.
- Terms acceptance.
- Admin request list.

## Phase 3: Services and estimates

- Service catalog manager.
- Pricing manager.
- Estimate builder.
- Customer estimate view.
- Estimate acceptance.

## Phase 4: Jobs and map

- Convert estimate to job.
- Schedule jobs.
- Crew job view.
- Checklist.
- Map markers.
- Before/after photos.

## Phase 5: Invoices, payments, expenses

- Invoice creation.
- Payment tracking.
- Expense logging.
- Earnings split.
- Basic reports.

## Phase 6: Polish

- Message templates.
- Mobile UX cleanup.
- Dashboard polish.
- Permission hardening.
- Test workflows.

---

# 24. Implementation priorities

## Highest priority

1. Role-based access.
2. Quote request flow.
3. Editable services/pricing.
4. Estimate acceptance with terms.
5. Job scheduling.
6. Payment tracking.
7. Map view.

## Medium priority

1. Expense tracking.
2. Earnings split.
3. Photo uploads.
4. Message templates.
5. Basic reports.

## Lower priority

1. Automated email.
2. SMS.
3. Route optimization.
4. PWA/offline mode.
5. Accounting export.

---

# 25. Definition of done for MVP

The MVP is complete when:

1. A customer can submit a quote request with property details and photos.
2. Admin can review the request and create an estimate.
3. Customer can accept the estimate and terms.
4. Admin can schedule the job.
5. Crew can view the job and location on a map.
6. Crew can complete checklist and upload before/after photos.
7. Admin can create invoice and record cash/Venmo payment.
8. App can calculate expenses, reserves, and crew split.
9. Admin can edit services, prices, taxes, payment instructions, terms, and checklist templates.
10. Customer data is protected by role-based permissions.

---

# 26. Final product constraint

The app must stay simple enough that the boys actually use it.

If a feature does not help them quote, schedule, do the job, collect payment, or understand earnings, it should not be in the MVP.

The correct product is not a mini-ServiceTitan. It is a disciplined digital clipboard with a map, estimates, terms, payments, and earnings tracking.

