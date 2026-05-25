# JJL Lawncare Admin + Crew UX/UI Audit

Date: 2026-05-24  
Scope: Admin + Crew Next.js app routes/components. Static, read-only code audit; no browser rendering or file changes beyond this requested report.

Input note: `/home/psykeus/jjl_lawn_services/plan.md` and `/home/psykeus/jjl_lawn_services/progress.md` were not present. I inspected the actual app files plus available planning docs (`UX_UI_REDESIGN_PLAN.md`, `FEATURE_SET.md`, `the-plan.md`).

## Review

- **Correct:** The product already has a clear admin information architecture in `components/layout/nav-config.ts:13-64`, and the crew IA is intentionally compact (`Today`, `Jobs`, `Map`, `Earnings`) at `components/layout/nav-config.ts:65-73`.
- **Correct:** Dark mode and focus styling are implemented with CSS variables and a pre-hydration theme script (`app/globals.css:3-44`, `app/layout.tsx:14-31`), and shared form/button primitives include focus-ring classes (`components/ui/button.tsx:24-35`, `components/ui/input.tsx:4-40`).
- **Correct:** Several high-volume lists already use mobile cards plus desktop tables: quote requests (`app/admin/quote-requests/page.tsx:30-69`), estimates (`app/admin/estimates/page.tsx:28-68`), jobs (`app/admin/jobs/page.tsx:33-78`), invoices (`app/admin/invoices/page.tsx:28-63`), customers (`app/admin/customers/page.tsx:53-109`), and users (`app/admin/users/page.tsx:141-250`).
- **Correct:** Operational planning primitives exist: daily capacity warnings (`app/admin/schedule/page.tsx:68-75`), slot scanning (`app/admin/schedule/slots/page.tsx:61-70`), deterministic routes (`app/admin/routes/page.tsx:51-61`), and an embedded admin map with route actions (`app/admin/map/admin-job-map.tsx:214-260`).

## Coverage

Inspected admin route families: dashboard, quote requests, customers/properties, estimates, jobs/new/detail, schedule/slots, routes, map, crew availability, checklists, invoices/detail, payments, expenses, earnings, services/new/edit/questions/upsells entry points, service areas, terms, users, settings.  
Inspected crew route families: dashboard, jobs/list/detail, map, earnings.  
Shared shell/components inspected: `AppShell`, `AppNav`, nav config, page header, buttons, forms, cards, stats, theme, globals.

## Priority findings and tickets

### P1 — Admin navigation is mobile-menu-only on desktop, and admin mobile quick nav prioritizes sales over field operations

**Evidence**
- `AppShell` renders header, content, and bottom nav only; there is no desktop sidebar/nav rail in `components/layout/app-shell.tsx:10-29`.
- `MobileNavButton` is always rendered in the header without a desktop-specific alternative (`components/layout/app-shell.tsx:22`; menu implementation at `components/layout/app-nav.tsx:70-128`).
- `MobileBottomNav` blindly takes the first four flat nav items (`components/layout/app-nav.tsx:130-132`). For admin, those are Dashboard, Quote Requests, Customers & Properties, Estimates (`components/layout/nav-config.ts:16-25`), leaving Jobs/Schedule/Map/Money behind the menu.

**UX impact**
- Admin desktop operators must open a dropdown to navigate rather than scanning a persistent operations sidebar.
- On phones, the admin bottom nav does not expose the most time-sensitive operational pages (Jobs, Schedule, Map) during field dispatch.

**Ticket**
- Add a responsive admin desktop sidebar using `navGroupsByRole.admin`.
- Keep the mobile menu for overflow, but define role-specific quick nav items instead of `slice(0, 4)`.
- Suggested admin quick nav: Dashboard, Jobs, Schedule, Map or Dashboard, Requests, Jobs, Money depending on primary operator role.

---

### P1 — Crew job detail does not match field-worker priority order

**Evidence**
- Crew job detail begins with notes (`app/crew/jobs/[id]/page.tsx:50-57`), then status update (`59-66`), checklist (`68-75`), photos (`77-88`), complete action (`90-94`), and location/directions in a right/lower aside (`97-102`).
- The location card only renders directions when coordinates exist (`app/crew/jobs/[id]/page.tsx:99-102`); there is no address-based fallback link in the detail page.
- The job query includes customer name only, not phone/email (`app/crew/jobs/[id]/page.tsx:25-27`), so field workers cannot call/text from the detail page.

**UX impact**
- On mobile, a crew member must scroll past notes and forms before reaching directions/location.
- The most common field sequence—set status, open directions, run checklist, upload before/after photos, complete—is not optimized.

**Ticket**
- Reorder crew detail mobile layout to: status + next action, address/directions/contact, checklist progress, photo upload, notes, earnings/history.
- Add a directions link that falls back to encoded address when lat/lng are missing.
- Include customer phone in the query and render tap-to-call/SMS actions when available.
- Consider a sticky bottom action bar for `On the way`, `In progress`, `Upload`, `Complete`.

---

### P1 — Scheduling/routing intelligence is separated from job creation and editing

**Evidence**
- Direct job creation collects date/time and crew assignment with plain fields/check boxes (`app/admin/jobs/new/page.tsx:48-58`) but does not show slot fit, crew availability, travel buffer, or route conflict feedback.
- Admin job edit has schedule, crew, duration, time window, and priority fields (`app/admin/jobs/[id]/page.tsx:72-89`) but no inline capacity warning before save.
- The schedule board has a separate slot finder and guidance (`app/admin/schedule/page.tsx:77-93`), and routes have a separate timeline (`app/admin/routes/page.tsx:51-61`).

**UX impact**
- Dispatchers can create or edit overbooked jobs without seeing the same warnings available elsewhere.
- Route planning becomes a post-entry audit instead of an inline scheduling decision.

**Ticket**
- Add a reusable `ScheduleFitPanel` for job create/edit that calls the same planner logic used by schedule/routes.
- Show available crew, remaining crew-minutes, time-window conflicts, and suggested start times before submit.
- Link candidate slots from `/admin/schedule/slots` directly into `/admin/jobs/new` with date/time/crew prefilled.

---

### P2 — Several data-heavy pages are table-only or horizontally scroll by default on mobile

**Evidence**
- Services: only an overflow table, no mobile cards (`app/admin/services/page.tsx:33-63`).
- Payments: only an overflow table (`app/admin/payments/page.tsx:20-32`).
- Expenses: form plus table, no mobile card/list alternative (`app/admin/expenses/page.tsx:30-55`).
- Earnings: only an overflow table after stat cards (`app/admin/earnings/page.tsx:69-88`).
- Crew earnings: only an overflow table after stat cards (`app/crew/earnings/page.tsx:60-71`).
- Crew availability: only an overflow table (`app/admin/crew/availability/page.tsx:56-67`).
- Schedule/slot tables use `overflow-x-auto` (`app/admin/schedule/page.tsx:97-99`, `app/admin/schedule/slots/page.tsx:68-70`).

**UX impact**
- Phone users need horizontal scrolling for high-value operational records, which conflicts with the app's mobile-first goal.
- Crew earnings is especially likely to be opened on a phone but is table-only.

**Ticket**
- Add a shared `ResponsiveDataView` pattern: card list below `md`, table above `md`.
- Start with crew earnings, payments, expenses, services, crew availability, and scheduling tables.
- Each mobile card should expose the primary object, status/amount/date, and one primary action.

---

### P2 — Many list pages lack filters/search/status tabs despite large operational datasets

**Evidence**
- Quote requests query all rows ordered by creation date and renders list/table with no filters (`app/admin/quote-requests/page.tsx:15-26`, `50-69`).
- Jobs query all jobs ordered by creation date with no status/date/crew filters (`app/admin/jobs/page.tsx:13-20`).
- Estimates and invoices similarly list all rows with no filters (`app/admin/estimates/page.tsx:12-24`, `app/admin/invoices/page.tsx:12-24`).
- Users has role filters (`app/admin/users/page.tsx:104-121`), but no search by name/email.

**UX impact**
- As data grows, admins must scan long lists instead of narrowing to `new`, `scheduled today`, `unpaid`, `needs review`, or a customer name.

**Ticket**
- Add consistent filter bars for data-heavy pages.
- Quote requests: status, risk, date, search by customer/address.
- Jobs: date range, status, crew member, unscheduled, route priority.
- Estimates/invoices/payments: status, date range, balance due, customer search.
- Persist filters in query params for sharable admin workflows.

---

### P2 — “Review first, create second” is inconsistent outside the redesigned customer page

**Evidence**
- Customers use an on-demand drawer and show records first (`app/admin/customers/page.tsx:29-39`, `51-113`; drawer at `app/admin/customers/create-customer-drawer.tsx:14-29`).
- Expenses place `Add expense` before the list (`app/admin/expenses/page.tsx:30-45`, list at `47-55`).
- Service areas place `Add area` before existing areas (`app/admin/service-areas/page.tsx:85-90`).
- Checklists place `New template` before existing templates (`app/admin/checklists/page.tsx:56-66`).
- Terms place `New terms version` before current versions (`app/admin/terms/page.tsx:37-55`).
- Users place `Create platform user` before the user list (`app/admin/users/page.tsx:123-141`).

**UX impact**
- Admins land on creation forms before seeing what already exists, increasing duplicate records and slowing review tasks.

**Ticket**
- Reuse the customer drawer/collapsible pattern for expenses, users, service areas, terms, and checklists.
- Put summaries/filter/list first; expose creation through a primary `Add` action in `PageHeader`.
- Keep complex edit forms on detail/full pages where needed.

---

### P2 — Admin map and crew map need stronger operational fallbacks and accessibility affordances

**Evidence**
- Admin map renders an unlabeled map `<div>` with fixed 640px height (`app/admin/map/admin-job-map.tsx:216-222`).
- Route optimization is limited to the first 10 mapped jobs (`app/admin/map/admin-job-map.tsx:195-207`). The UI text says “up to the first 10 mapped jobs” (`241`), but there is no warning when more routable jobs are hidden from optimization.
- Crew map is a card grid with per-job direction links only; it does not offer a “today route” or route ordering (`app/crew/map/page.tsx:24-40`).

**UX impact**
- Map-heavy workflows are less useful to keyboard/screen-reader users and less efficient for full-day routing.
- Crew members can open one stop at a time but cannot launch a day route from the crew map.

**Ticket**
- Add accessible summary/list controls beside maps: stop count, unmapped count, route order, and keyboard-selectable stops.
- Add `aria-label` or descriptive region text to embedded map containers.
- Warn when route optimization excludes jobs beyond the first 10.
- Add crew `Open today route in Google Maps` using scheduled jobs with coordinates/address fallback.

---

### P2 — Customer/contact context is thin in field and scheduling workflows

**Evidence**
- Crew dashboard and job list only show customer name/address/schedule/status (`app/crew/dashboard/page.tsx:65-69`, `app/crew/jobs/page.tsx:32-36`).
- Crew job detail fetches only customer name and property address/coordinates (`app/crew/jobs/[id]/page.tsx:25-27`).
- Admin route timeline shows customer/address/workload but not phone or safety/tool notes (`app/admin/routes/page.tsx:53-57`).

**UX impact**
- Field workers and dispatchers need extra navigation to answer simple operational questions: “Can I call them?”, “Any gate/pet/hazard notes?”, “What tools?”

**Ticket**
- Include phone, gate/pet/hazard/access notes, and safety/tool notes in crew job detail top summary.
- Add compact warning chips for hazards/pets/gate notes in crew list cards and admin route timeline.
- Add tap-to-call where phone exists.

---

### P3 — Dialog/drawer accessibility needs polish

**Evidence**
- `CreateCustomerDrawer` sets `role="dialog"` and `aria-modal="true"` (`app/admin/customers/create-customer-drawer.tsx:16`) but does not implement Escape-to-close, focus trap, initial focus, or focus return (`app/admin/customers/create-customer-drawer.tsx:9-75`).
- The mobile navigation menu does implement outside-click and Escape close (`components/layout/app-nav.tsx:79-99`), so there is already a pattern to borrow.

**UX impact**
- Keyboard users can tab behind the drawer and may not be returned to the triggering button after closing.

**Ticket**
- Create a shared `Drawer/Dialog` component with focus trap, Escape close, labeled title/description IDs, scroll locking, and focus return.
- Migrate customer drawer first, then use it for other `Add` flows from the P2 review-first ticket.

---

## Suggested implementation order

1. **Crew field flow quick win:** reorder `/crew/jobs/[id]`, add directions fallback and phone actions.
2. **Admin navigation:** desktop sidebar + role-specific mobile quick nav.
3. **Scheduling integration:** inline capacity/slot warnings in direct job create and job detail.
4. **Responsive data view:** convert table-only money/operations pages to mobile cards.
5. **Filters/search:** add query-param filter bars to Jobs, Quote Requests, Estimates, Invoices, Payments.
6. **Drawer standardization:** shared accessible drawer and move creation forms behind header actions.

## Notes

- No blocker-level visual defect was found from static inspection alone.
- The app is materially ahead of a raw CRUD UI: it has grouped IA, stat dashboards, map/route primitives, dark mode, and several responsive list patterns. The main UX debt is consistency and field-operator efficiency across the remaining pages.
