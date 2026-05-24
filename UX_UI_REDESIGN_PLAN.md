# JJL Lawncare UX/UI Redesign Plan

## Goal

Make the platform feel like one organized product instead of many disconnected pages. The redesign should be mobile-first, reduce wasted space, keep related tasks together, make existing data visible before creation flows, and improve brand/theme consistency with JJ&L Lawncare logo assets and dark mode.

## Guiding principles

1. **Review first, create second**
   - Data-heavy pages should show what is already in the system at the top.
   - Creation/editing should be launched by clear actions such as `Add customer`, `Add expense`, `Create user`, or `Record payment`.
   - Do not place long creation forms above the list being reviewed.

2. **Mobile-first, desktop-enhanced**
   - Phone layouts should use stacked cards, clear primary actions, and thumb-friendly controls.
   - Desktop layouts can use sidebars, tables, split panes, and dense metrics.
   - Avoid horizontal scrolling as the default mobile experience.

3. **One information architecture**
   - The admin dashboard, sidebar, mobile nav, and page groupings should use the same categories.
   - Related operational tasks should live together.

4. **Preserve workflows and contracts**
   - Server action form names, hidden fields, role protection, RLS expectations, upload fields, and current data model behavior must remain intact.
   - UX changes should not silently alter pricing, quote validation, job workflow, or access rights.

5. **Reusable patterns before page-by-page cleanup**
   - Add shared page headers, responsive data views, modal/drawer forms, alerts, stat cards, action bars, and form sections before converting all pages.

---

## Proposed navigation and grouping

### Public site

Primary nav:

- Home
- Services
- Pricing
- Service Area
- Contact
- Request Quote CTA

Secondary/footer:

- Terms
- Login

Mobile public nav:

- Header with logo, Request Quote CTA, menu button
- Menu drawer containing Services, Pricing, Service Area, Contact, Terms, Login

### Admin app

Use the same grouping in the desktop sidebar, mobile drawer, and admin dashboard.

#### Dashboard

- Command center
- Key metrics
- Recent requests
- Upcoming jobs
- Work queues

#### Intake & Sales

- Quote Requests
- Customers & Properties
- Estimates
- Direct Job Entry

#### Operations

- Jobs
- Schedule
- Open Slots
- Routes
- Map
- Crew Availability
- Checklists

#### Money

- Invoices
- Payments
- Expenses
- Earnings

#### Catalog & Site

- Services
- Service Questions
- Service Upsells
- Service Areas
- Terms

#### Administration

- Users & Access
- Settings

### Crew app

Mobile-first bottom/quick nav:

- Today
- Jobs
- Map
- Earnings

Crew job detail priority order on mobile:

1. Job status and next action
2. Address/directions
3. Checklist
4. Photo upload
5. Customer/job notes
6. Earnings/history

### Customer app

Mobile-first nav:

- Dashboard
- Requests
- Estimates
- Invoices
- Properties
- Account

Customer pages should emphasize:

- Current request/estimate/invoice status
- Next action required
- Simple property/account review

---

## Page pattern rules

### Data list pages

Examples: customers, users, jobs, estimates, invoices, payments, expenses, services, service areas, checklists, terms, crew availability.

Required structure:

1. Page header
   - Title
   - Short description
   - Primary action button
   - Optional secondary filters/actions

2. Data summary
   - Counts, status tabs, or compact stat cards
   - Show existing records before any create form

3. Filters/search
   - Search text
   - Status/role/date filters where relevant
   - Mobile-friendly stacked controls

4. Responsive data view
   - Mobile: cards with primary details, status badges, and row actions
   - Desktop: table where appropriate

5. Create/edit flow
   - Triggered by button
   - Opens modal/drawer/sheet for short forms
   - Full-page flow only for complex multi-section workflows

### Detail pages

Examples: quote request detail, estimate detail, invoice detail, job detail, customer request detail.

Required structure:

1. Breadcrumb/back link
2. Header with status and primary action
3. Summary card with high-value facts
4. Related sections grouped by task
5. Side panel or lower cards for secondary data
6. Forms should be collapsible, drawer-based, or sectioned where practical

### Dashboard pages

Dashboards should answer:

- What needs attention?
- What is scheduled next?
- What money is outstanding?
- What is the fastest next action?

Avoid making dashboards a duplicate sidebar. Use grouped queues and metrics.

---

## Modal/drawer migration plan

Short create/edit forms should move out of the top of list pages into reusable modal/drawer flows.

### Convert first

- `/admin/customers`
  - Move `New customer / account` long form behind `Add customer`.
  - Show customer/property list and status summary first.
  - Consider a full-screen mobile drawer because the form is long.

- `/admin/users`
  - Move `Create platform user` behind `Create user`.
  - Keep archive/delete controls in row/card actions.

- `/admin/expenses`
  - Move add expense form behind `Add expense`.
  - Show expense list/summary first.

- `/admin/crew/availability`
  - Move availability form behind `Add availability`.

- `/admin/service-areas`
  - Move service-area form behind `Add service area`.

- `/admin/checklists`
  - Move add template and add item forms into dialogs/drawers.

- `/admin/terms`
  - Move create/edit terms body into modal or dedicated editor page; show existing terms first.

- `/admin/invoices/[id]`
  - Move record payment form behind `Record payment` action.

- `/admin/estimates/[id]`
  - Move add line item behind `Add line item` action.

### Keep as full-page or full-screen wizard

- `/request-quote`
- `/admin/jobs/new`
- `/admin/services/new`
- `/admin/services/[id]/edit`
- Large terms editor if modal feels cramped

---

## Reusable components to add

### Layout

- `BrandLogo`
  - Supports light/dark variants
  - Used in public header and authenticated shell

- `PageHeader`
  - Title, description, eyebrow/back link, status, primary actions
  - Mobile actions stack full-width; desktop actions align right

- `AppNav`
  - Central grouped nav config by role
  - Desktop grouped sidebar
  - Mobile drawer
  - Active route state

- `MobileBottomNav`
  - Role-specific quick links for crew/customer/admin shortcuts

### Data display

- `StatCard` / `StatGrid`
- `ResponsiveDataView`
  - Mobile card renderer
  - Desktop table renderer
  - Empty state
- `RecordCard`
  - Common mobile card layout for rows
- `StatusTabs` or `FilterBar`

### Forms/actions

- `Modal` / `Drawer`
  - No new dependency unless needed
  - Accessible close button, backdrop, focus handling
- `FormSection`
- `ResponsiveFormGrid`
- `ActionBar`
- `Alert`
- `EmptyState`
- `ConfirmAction`
  - Useful for delete/archive controls

### Media

- `UploadField`
- `PhotoGrid`

---

## Brand, logo, favicon, and dark mode

### Logo direction

Create a simple JJ&L Lawncare mark:

- Text: `JJ&L Lawncare`
- Icon concept: shield/leaf/lawn stripes
- Light logo: green mark/text on light background
- Dark logo: lighter green/cream mark/text on dark background

Files to add under `public/`:

- `logo-light.svg`
- `logo-dark.svg`
- `mark.svg`
- `favicon.svg`
- Optional `apple-touch-icon.svg` or PNG later

Use metadata in `app/layout.tsx` for favicon/app title.

### Dark mode approach

Use class-based dark mode at the document root:

- Add CSS variables for `.dark`
- Add a small theme toggle in authenticated shell and public menu/header
- Persist theme in `localStorage`
- Apply before/at hydration via a tiny client component or inline script to avoid flash if needed

Token additions:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--muted`
- `--muted-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--accent`
- `--border`
- `--input`
- `--ring`
- `--danger`
- `--warning`
- `--success`

Replace hardcoded light classes over time:

- `bg-white`
- `bg-green-50`
- `bg-red-50`
- `bg-yellow-50`
- direct `text-green-*`, `text-red-*`, etc.

Start with primitives so pages inherit theme improvements.

---

## Implementation phases

### Phase 1 — Design system foundation

Deliverables:

- Logo SVGs and favicon
- Dark mode CSS tokens
- Theme toggle
- `BrandLogo`
- `PageHeader`
- `Alert`
- `EmptyState`
- `StatCard`
- `ActionBar`
- Updated `Button`, `Card`, `Input` to avoid hardcoded white-only assumptions where safe

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

### Phase 2 — Navigation shell

Deliverables:

- Central grouped nav config
- Desktop grouped sidebar
- Mobile app drawer
- Public mobile menu
- Active route styling
- `main` layout `min-w-0`
- Mobile shortcut/bottom nav for crew/customer/admin essentials

Priority routes to test:

- `/admin/dashboard`
- `/admin/users`
- `/customer/dashboard`
- `/crew/dashboard`
- `/request-quote`

### Phase 3 — Admin data pages review-first

Deliverables:

- Convert `/admin/customers` to list-first layout and modal/drawer create flow
- Convert `/admin/users` create user to modal/drawer
- Convert `/admin/expenses` add expense to modal/drawer
- Convert `/admin/crew/availability` add availability to modal/drawer
- Convert `/admin/service-areas` add area to modal/drawer
- Add shared filter/search/action bars where useful

Rule: existing data must appear before creation forms.

### Phase 4 — Responsive data views

Deliverables:

- Introduce responsive mobile cards + desktop tables for:
  - Admin users
  - Admin customers
  - Admin jobs
  - Admin quote requests
  - Admin estimates/invoices/payments/expenses
  - Admin services/service areas/checklists/terms
  - Customer estimates/invoices
  - Crew jobs

### Phase 5 — Workflow-focused detail pages

Deliverables:

- Improve job detail action hierarchy
- Move crew directions near top on mobile
- Drawer/collapsible forms for schedule/payment/line-item actions
- Improve quote request detail grouping
- Improve estimate/invoice next-action clarity

### Phase 6 — Public and customer polish

Deliverables:

- Public mobile nav
- Quote wizard progress/spacing/accessibility polish
- Customer dashboard cards and next-action summaries
- Customer documents/pages become card-first on mobile

### Phase 7 — Final dark-mode and accessibility pass

Deliverables:

- Remove remaining light-only hardcoded colors
- Test keyboard navigation and focus states
- Test dark mode across public/admin/customer/crew
- Verify logo variants and favicon

---

## Validation checklist

Automated:

```bash
npm run typecheck
npm run lint
npm run build
npm run qa:rls
```

Responsive manual widths:

- 320px
- 375px
- 390px
- 768px
- 1024px
- desktop

Manual route smoke list:

- `/`
- `/services`
- `/request-quote`
- `/auth/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/customers`
- `/admin/services`
- `/admin/jobs`
- `/admin/jobs/new`
- `/admin/schedule`
- `/admin/map`
- `/customer/dashboard`
- `/customer/requests`
- `/customer/estimates`
- `/customer/invoices`
- `/crew/dashboard`
- `/crew/jobs`
- `/crew/jobs/[id]`

Regression checks:

- Forms still submit to server actions
- File uploads still work
- Customer/crew/admin RLS still passes
- Admin delete/archive controls still protect self-account
- Quote wizard selected service JSON still submits
- No horizontal page overflow except intentional scroll regions
- Dark mode does not hide status badges, inputs, or map fallback UI

---

## Suggested first implementation slice

Start with a small but visible foundation slice:

1. Add logo/favicon assets.
2. Add dark mode tokens and theme toggle.
3. Add grouped nav config and mobile drawer shell.
4. Add `PageHeader`, `Alert`, `EmptyState`, `StatCard`, and `ActionBar`.
5. Convert `/admin/customers` to list-first with an `Add customer` drawer/modal.
6. Validate and deploy.

This first slice addresses the largest complaints without rewriting every page at once.
