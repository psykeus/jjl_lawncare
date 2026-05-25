# JJL Lawncare Frontend UX/UI Audit Report

_Date: 2026-05-24_

Scope: Static frontend review of the Next.js App Router application using the requirements in `FRONTEND_UX_REVIEW_AGENT_PROMPT.md`. This audit reviewed public, auth, customer, crew, admin, shared layout, navigation, and UI component files. Browser-device QA is still recommended before treating responsive findings as visually verified.

---

## A. Executive Summary

### Overall frontend quality

The app is already beyond a basic CRUD portal. It has role-based dashboards, grouped navigation, dark mode tokens, responsive card patterns on several high-volume admin/customer pages, reusable UI primitives, public quote intake, customer/crew/admin workflows, and good Supabase-backed data separation.

The largest remaining UX gap is consistency: some areas are polished and mobile-first while others still use table-only layouts, inline create forms above records, or workflows that require users to discover separate admin tools instead of receiving guidance at the moment of action.

### Biggest strengths

1. Clear role separation for public, customer, crew, and admin experiences.
2. Mobile-first direction is visible in app shell, bottom nav, compact dashboards, and card-based lists.
3. Public quote flow supports multi-service selection, service-specific questions, saved-customer prefilling, and optional uploads.
4. Admin information architecture is comprehensive and grouped by business function.
5. Dark mode and semantic color variables are established.
6. Status badges use text labels instead of relying on color alone.
7. Several core admin list pages already use mobile cards plus desktop tables.
8. Customer dashboard now surfaces requests, jobs, estimates, invoices, history, and saved account context.
9. Crew dashboard/job flows exist and are role-specific.
10. User management includes role filters and password reset actions.

### Biggest risks

1. Password login defaults to `/admin/dashboard`, which can send customer/crew users to the wrong experience.
2. Quote wizard has weak per-step validation and custom controls that are not fully accessible.
3. Some mobile interactions are still too table-heavy or too small for comfortable touch use.
4. Admin scheduling/routing intelligence is separated from job creation/editing.
5. Crew field workflow does not prioritize directions/contact/status actions first on mobile.
6. Menus and drawers need stronger focus management and keyboard accessibility.
7. Data-heavy admin pages need consistent filtering/search before real production volume grows.
8. Customer jobs are shown indirectly under requests rather than as a clear job/history concept.
9. Some create forms still appear before existing data, increasing admin friction.
10. Public conversion pages could use stronger next-action CTAs and mobile pricing cards.

### Top 10 improvements

1. Make login redirect role-aware: admin → admin dashboard, crew → crew dashboard, customer → customer dashboard.
2. Add accessible per-step quote wizard validation with preserved user progress.
3. Convert quote wizard service/options controls to native checkbox/radio semantics or equivalent ARIA states.
4. Reorder crew job detail around field priorities: status, directions/contact, checklist, photos, complete.
5. Add responsive card views to remaining table-only pages.
6. Add filters/search/status tabs to quote requests, jobs, estimates, invoices, payments, expenses, and users.
7. Integrate scheduling/route fit guidance directly into job create/edit flows.
8. Add focus trapping/initial focus/focus return to navigation menus and drawers.
9. Move remaining large create forms into drawers/modals/header actions so records appear first.
10. Add a customer-facing job/history concept or enrich request details with linked job progress.

---

## B. Role-by-Role Review

### Public visitor

**What works well**
- Public navigation is simple: services, pricing, service area, contact, login, request quote.
- Services/pricing/service-area content is data-backed, supporting admin-managed site content.
- Request quote CTA is present and prominent.
- Quote wizard breaks intake into understandable steps.

**What is confusing**
- Pricing uses a table pattern that can be less friendly on mobile than service cards.
- Service area page explains coverage but should more strongly push users into quote request.
- Quote wizard lets users progress before some required fields are valid.

**Recommended improvements**
- Add mobile pricing cards.
- Add CTA sections to service-area/contact pages.
- Add wizard step validation, better error messages, and saved progress.
- Add success-page next actions: dashboard, submit another request, home/services.

**Mobile concerns**
- Step pills/chips should meet 44px touch target guidance.
- Quote wizard custom controls need stronger selected-state semantics.

### Customer

**What works well**
- Dashboard summarizes requests, jobs, estimates, invoices, balances, and saved account/property context.
- Existing customer request flow preloads contact/property info.
- Estimates and invoices have list pages and detail pages.
- Customer properties are visible.

**What is confusing**
- Jobs are surfaced on the dashboard but link back into requests; there is no dedicated customer jobs route/detail.
- Multi-service requests may appear as a single service in list/dashboard summaries.
- Properties are mostly read-only.

**Recommended improvements**
- Add `/customer/jobs` or enrich request detail with linked job timeline/status/photos.
- Show multi-service summaries like “Mowing + 2 add-ons.”
- Add property edit/change-request flows for gate/access/pet/hazard notes.
- Improve invoice/estimate detail mobile line items.

**Mobile concerns**
- Detail financial tables should become mobile cards/definition lists.
- Customer “next job” should link to an actionable detail, not a generic requests list.

### Crew

**What works well**
- Crew IA is compact: dashboard/today, jobs, map, earnings.
- Crew can view assigned work and update job status.
- Job detail includes notes, checklist, photos, completion, and location.

**What is confusing**
- Job detail begins with notes/forms before location/directions/contact.
- There is no address fallback direction link when coordinates are missing.
- Crew cannot easily tap to call/text customer from job detail.
- Crew map is stop-by-stop rather than an optimized day route.

**Recommended improvements**
- Reorder crew job detail for field reality: next action, directions/contact, checklist, photos, notes.
- Add phone/SMS actions and gate/pet/hazard chips.
- Add “Open today route in Google Maps.”
- Make crew earnings mobile-card friendly.

**Mobile concerns**
- Crew pages are likely phone-first in the field; table-only earnings and deep scrolling on job detail should be fixed early.

### Admin

**What works well**
- Admin IA is comprehensive and grouped: intake/sales, operations, money, catalog/site, administration.
- Admin dashboard and key metrics are clickable.
- Many major lists have responsive mobile card alternatives.
- User management now has role filters and reset email actions.

**What is confusing**
- Admin desktop navigation is still hidden behind the hamburger; this is slower for heavy operators.
- Mobile bottom nav uses the first four nav items rather than operator-priority items.
- Scheduling intelligence is available on schedule/slots/routes but not directly inside job creation/edit.
- Several pages still place create forms before existing records.

**Recommended improvements**
- Add persistent desktop app nav/sidebar for admin on `lg+`, keeping hamburger for mobile/overflow.
- Define role-specific quick nav instead of slicing the first four nav items.
- Add filter/search bars to data-heavy pages.
- Use drawers/modals for create flows on expenses, users, service areas, terms, checklists.

**Mobile concerns**
- Remaining table-only pages and scheduling tables require horizontal scrolling.
- Dense admin forms need progressive disclosure and sticky action bars.

---

## C. Page-by-Page Review

| Area | Route | Assessment | Priority |
|---|---|---|---|
| Public | `/` | Strong marketing entry and CTA direction. Add more trust proof/testimonials if available. | Medium |
| Public | `/services` | Good data-backed services. Ensure every service has a clear “request this” CTA. | Low |
| Public | `/pricing` | Useful but table-heavy on mobile. Add pricing cards below `md`. | Medium |
| Public | `/service-area` | Good service-area list/map concept. Add stronger quote CTA and manual ZIP check emphasis. | Medium |
| Public | `/contact` | Simple path to quote request. Add response-time/contact expectation. | Low |
| Public | `/terms` | Data-backed terms. Add clearer print/download or last-updated treatment if needed. | Low |
| Public | `/request-quote` | High-value flow. Needs per-step validation, accessible controls, stronger service-area gate, success CTAs. | Critical |
| Auth | `/auth/login` | Functional, but password login default destination is wrong for non-admin roles. | Critical |
| Auth | `/auth/signup` | Good customer entry. Add clearer post-signup expectation and dashboard path. | Medium |
| Auth | `/auth/callback` | Should handle exchange errors explicitly. | High |
| Auth | `/auth/update-password` | Needed reset flow. Add more recovery navigation and expired-link handling. | Medium |
| Customer | `/customer/dashboard` | Stronger than before; tracks requests/jobs/history/financials. Needs direct job detail concept. | High |
| Customer | `/customer/requests` | Good list; should display multi-service request summaries. | High |
| Customer | `/customer/requests/[id]` | Good detail direction; should show linked job timeline when converted. | High |
| Customer | `/customer/estimates` | Good list/card pattern. Add stronger accept/next-action context. | Medium |
| Customer | `/customer/estimates/[id]` | Detail table needs mobile cards and back navigation. | High |
| Customer | `/customer/invoices` | Good list/card pattern. Consider payment proof/status clarity. | Medium |
| Customer | `/customer/invoices/[id]` | Detail table/payment instructions need mobile-friendly layout and back link. | High |
| Customer | `/customer/properties` | Useful read-only cards. Add edit/request-change for notes and access details. | High |
| Customer | `/customer/account` | Simple profile updates. Could include password/security links and notification preferences. | Medium |
| Crew | `/crew/dashboard` | Useful today overview. Add next-action emphasis and route CTA. | High |
| Crew | `/crew/jobs` | Good assigned jobs list. Add filters for today/upcoming/completed and safety/contact chips. | Medium |
| Crew | `/crew/jobs/[id]` | Needs field-priority ordering, tap-to-call, direction fallback, sticky action bar. | Critical |
| Crew | `/crew/map` | Useful direction links. Add full-day route and unmapped stop warnings. | High |
| Crew | `/crew/earnings` | Good info, but table-only on mobile. Convert to cards. | Medium |
| Admin | `/admin/dashboard` | Solid compact operational dashboard. Add exceptions/alerts like overdue invoices, unscheduled approved jobs. | Medium |
| Admin | `/admin/customers` | Strong list-first drawer pattern. Use as model elsewhere. | Low |
| Admin | `/admin/quote-requests` | Responsive list exists. Needs filters/search/status tabs. | High |
| Admin | `/admin/quote-requests/[id]` | Core conversion route. Ensure next-best actions are visually guided: estimate/job/contact. | High |
| Admin | `/admin/jobs` | Responsive list exists. Needs date/status/crew filters. | High |
| Admin | `/admin/jobs/new` | Direct job entry should show scheduling/route fit and prefilled slot links. | Critical |
| Admin | `/admin/jobs/[id]` | Rich edit route. Add inline schedule conflict/capacity warnings. | High |
| Admin | `/admin/schedule` | Useful capacity planning. Tables need responsive cards and direct job-create links. | High |
| Admin | `/admin/schedule/slots` | Valuable planner. Candidate slots should deep-link/prefill job creation. | High |
| Admin | `/admin/routes` | Useful route timeline. Add phone/safety/access chips and route export/open. | Medium |
| Admin | `/admin/map` | Strong map primitive. Add accessible stop list, unmapped warnings, and route-limit warning. | High |
| Admin | `/admin/services` | Table-only; add mobile cards and service status filters. | Medium |
| Admin | `/admin/services/new` | Good full-page create route. Keep if complex; otherwise link from list header. | Low |
| Admin | `/admin/services/[id]/edit` | Good detailed edit. Ensure sticky save/cancel for long mobile forms. | Medium |
| Admin | `/admin/services/[id]/questions` | Operationally useful. Add drag/reorder or grouped question preview if not present. | Medium |
| Admin | `/admin/services/[id]/upsells` | Useful catalog tooling. Add clearer preview of customer-facing upsells. | Low |
| Admin | `/admin/estimates` | Responsive list exists. Needs status/customer/date filters. | High |
| Admin | `/admin/estimates/[id]` | Important sales document route. Ensure accept/send/convert actions are prominent. | Medium |
| Admin | `/admin/invoices` | Responsive list exists. Needs filters for unpaid/overdue/paid. | High |
| Admin | `/admin/invoices/[id]` | Important money detail. Ensure payments/proofs are prominent and mobile-friendly. | Medium |
| Admin | `/admin/payments` | Table-only; add mobile cards and filters. | Medium |
| Admin | `/admin/expenses` | Create form appears before data. Move to drawer and add mobile cards. | High |
| Admin | `/admin/earnings` | Table-only after stats. Add cards and crew/date filters. | Medium |
| Admin | `/admin/crew/availability` | Table-only. Add mobile cards and crew/day filters. | Medium |
| Admin | `/admin/checklists` | Create form before list. Move to drawer/collapsible. | Medium |
| Admin | `/admin/service-areas` | Add form before list. Move to drawer and add map/list first. | Medium |
| Admin | `/admin/terms` | Create form before versions. Move to header action/drawer or collapsible editor. | Medium |
| Admin | `/admin/users` | Stronger now with filters/reset. Add search by name/email and consider create drawer. | Medium |
| Admin | `/admin/settings` | Admin-only configuration. Group settings by risk and add save feedback. | Low |

---

## D. Workflow Review

### Public visitor requests a quote

**Current flow**: Public CTA → quote wizard → address → services → details/photos → contact/terms → submit.

**Friction points**
- Custom controls lack full accessible semantics.
- Users can advance without validating current step.
- Service-area rejection can happen late.
- Error redirect can reset wizard state and uploads.

**Recommended flow**
- Validate each step before moving forward.
- Block outside-service-area submissions earlier.
- Preserve state on errors.
- Make selected services/questions native or ARIA-complete controls.
- Add success CTAs.

### Existing customer requests another service

**Current flow**: Logged-in customer opens `/request-quote`; saved contact/property details are prefilled; wizard starts closer to service selection.

**Friction points**
- Saved address may not be actively rechecked until user interaction.
- If a customer has multiple properties, they do not appear to choose among them.

**Recommended flow**
- Add a “Choose saved property” step/card when multiple properties exist.
- Auto-check service area for saved property.
- Allow quick “Use this property” and “Different property” choices.

### Customer checks history

**Current flow**: Dashboard → requests/estimates/invoices/properties/account.

**Friction points**
- Jobs are not first-class in nav.
- Request summaries may underrepresent multi-service requests.

**Recommended flow**
- Add job timeline/status to request detail or create customer jobs route.
- Show completed jobs as service history with dates, status, and invoice links.

### Crew completes job

**Current flow**: Dashboard/jobs → job detail → notes/status/checklist/photos/complete/location.

**Friction points**
- Field actions are not in priority order.
- Contact/directions are not prominent enough.
- No day-route CTA.

**Recommended flow**
- Status + directions/contact first.
- Checklist/photos next.
- Completion sticky action when requirements are met.
- Route view with all stops.

### Admin converts quote request

**Current flow**: Quote requests list/detail; admin can process into estimates/jobs through detail actions.

**Friction points**
- List needs filters for new/needs review/high risk.
- Detail should emphasize next best action.

**Recommended flow**
- Add status tabs and search to quote requests.
- In detail, show a guided action panel: contact customer, create estimate, schedule job, mark declined.

### Admin schedules and assigns crew

**Current flow**: Jobs new/edit have direct schedule fields; schedule/slots/routes provide separate intelligence.

**Friction points**
- Dispatch can overbook without inline warning.
- Candidate slots do not appear deeply integrated into job creation.

**Recommended flow**
- Embed `ScheduleFitPanel` into job new/edit.
- Deep-link candidate slots with prefilled date/time/crew.
- Show conflicts and route/travel risk before save.

### Admin manages users/password resets

**Current flow**: Users list with type filters, reset action, access update, archive/delete.

**Friction points**
- No search by name/email.
- Create user form appears above data.

**Recommended flow**
- Add search and active/inactive filters.
- Move create form into drawer/modal.
- Add confirmations for reset/archive/delete where needed.

---

## E. Component / Design System Review

### Strong components
- `AppShell`: consistent authenticated container with brand, theme, sign-out, nav, bottom nav.
- `PageHeader`: standardizes page introductions/actions.
- `Card`, `Button`, `Input`, `Alert`, `StatCard`: useful shared primitives.
- `StatusBadge`: normalizes status display with text labels.
- Public header/mobile menu and app hamburger provide consistent navigation foundation.

### Issues to fix

1. **Navigation menu semantics**
   - Auth app menu uses `role="menu"` without full menu keyboard behavior. Prefer disclosure/nav semantics or implement menuitem keyboard rules.

2. **Focus management**
   - Menus/drawers need initial focus, focus trap, Escape close, and focus return.

3. **Touch target sizing**
   - `sm`/`md` buttons and wizard chips can be below 44px. Add a `touch-target` utility or make mobile default controls taller.

4. **Alert semantics**
   - `Alert` should support `role="alert"`, `role="status"`, and `aria-live`.

5. **Field hint/error association**
   - `Field` should wire hints/errors to inputs through `aria-describedby` and `aria-invalid`.

6. **Responsive data pattern**
   - Create a reusable `ResponsiveDataView` or documented pattern: mobile cards below `md`, desktop table above `md`.

7. **Design tokens**
   - Tokens cover colors well. Add tokens/utilities for touch target, radii, card spacing, elevation, table min widths, and type scale.

---

## F. Prioritized Implementation Roadmap

### 1. Quick wins

- Add role-aware password login redirects.
- Add back links to customer estimate/invoice detail pages.
- Add success CTAs to quote confirmation page.
- Add service-area/contact page request quote CTAs.
- Add user search to `/admin/users`.
- Normalize `StatusBadge` inputs with trim/lowercase and title labels.

### 2. High-impact UX fixes

- Add quote wizard step validation and accessible controls.
- Reorder crew job detail for mobile field use.
- Add customer job timeline/detail concept.
- Add schedule fit warnings to job new/edit.
- Add guided next-action panels to quote request detail and job detail.

### 3. Responsive/mobile fixes

- Convert pricing table to mobile cards.
- Convert customer estimate/invoice detail tables to mobile cards.
- Convert services, payments, expenses, earnings, crew earnings, crew availability, schedule tables to responsive card/table patterns.
- Raise mobile tap target sizes.
- Add sticky mobile action bars to long job/document forms.

### 4. Admin productivity improvements

- Add filters/search/status tabs to quote requests, jobs, estimates, invoices, payments, expenses.
- Move create forms to drawers/modals for expenses, users, service areas, terms, checklists.
- Add persistent desktop admin nav or grouped nav rail on `lg+`.
- Define role-specific bottom quick nav items.
- Add bulk actions later for high-volume list pages.

### 5. Customer conversion/retention improvements

- Add trust proof/testimonials or “what happens next” content to public pages.
- Add multi-property selection in quote wizard for returning customers.
- Add clearer optional/required photo messaging tied to service configuration.
- Add dashboard next actions: pay invoice, approve estimate, view upcoming job, request repeat service.

### 6. Longer-term polish

- Build a small component usage guide for page patterns.
- Add route optimization/full-day route UX for crew.
- Add accessible map side panels and keyboard-selectable stop lists.
- Add notification preferences and communication history.
- Add customer property edit/change request workflow.

---

## G. Specific Actionable Tickets

### Ticket 1: Role-aware login redirect
- **Area/page:** `lib/auth/actions.ts`, `/auth/login`
- **Problem:** Password login defaults to `/admin/dashboard`, wrong for customers/crew.
- **Solution:** After successful auth, fetch profile role and redirect accordingly.
- **Acceptance criteria:** Admin lands admin dashboard; crew lands crew dashboard; customer lands customer dashboard; inactive/missing role shows clear error.
- **Priority:** Critical

### Ticket 2: Accessible quote wizard validation
- **Area/page:** `/request-quote`
- **Problem:** Users can advance with invalid steps and custom controls are not fully accessible.
- **Solution:** Add per-step validation, focus first invalid field, preserve state, use checkbox/radio semantics or ARIA states.
- **Acceptance criteria:** No invalid forward progress; errors are announced; keyboard/screen-reader users can identify selected options.
- **Priority:** Critical

### Ticket 3: Service-area gate improvement
- **Area/page:** `request-address-fields.tsx`, quote wizard
- **Problem:** Outside-area rejection may happen late.
- **Solution:** Show explicit check state and block forward progress when address is outside service area.
- **Acceptance criteria:** Valid address shows in/out status; outside status blocks next step with clear message.
- **Priority:** High

### Ticket 4: Crew job detail field-first redesign
- **Area/page:** `/crew/jobs/[id]`
- **Problem:** Directions/contact/status are not prioritized.
- **Solution:** Reorder mobile layout; add tap-to-call/SMS; add address fallback directions; add sticky action bar.
- **Acceptance criteria:** Crew can start navigation/contact/update status from top of mobile page.
- **Priority:** Critical

### Ticket 5: Admin job schedule fit panel
- **Area/page:** `/admin/jobs/new`, `/admin/jobs/[id]`
- **Problem:** Job creation/editing lacks inline availability/route conflict guidance.
- **Solution:** Reuse schedule planner data to display crew availability, capacity, conflicts, and suggested slots.
- **Acceptance criteria:** Admin sees fit/conflict before submit and can apply candidate slot suggestions.
- **Priority:** Critical

### Ticket 6: Responsive data view component
- **Area/page:** Shared UI + table-heavy pages
- **Problem:** Several pages require horizontal scrolling on mobile.
- **Solution:** Create shared mobile-card/desktop-table pattern and migrate pages.
- **Acceptance criteria:** No horizontal overflow for services, payments, expenses, earnings, crew earnings, availability, financial details.
- **Priority:** High

### Ticket 7: Admin filter/search bars
- **Area/page:** Quote requests, jobs, estimates, invoices, payments, expenses, users
- **Problem:** Large datasets are hard to scan.
- **Solution:** Add query-param filters for status/date/customer/crew/search.
- **Acceptance criteria:** Filters persist in URL and reduce displayed rows correctly.
- **Priority:** High

### Ticket 8: Accessible menu/drawer foundation
- **Area/page:** `AppNav`, `PublicMobileMenu`, `CreateCustomerDrawer`
- **Problem:** Focus trapping/restoration and ARIA semantics are incomplete.
- **Solution:** Create shared disclosure/dialog behavior with Escape, focus trap, initial focus, return focus.
- **Acceptance criteria:** Keyboard-only QA passes for menus/drawers.
- **Priority:** High

### Ticket 9: Customer job history route or timeline
- **Area/page:** Customer dashboard/requests
- **Problem:** Jobs/history are not first-class for customers.
- **Solution:** Add `/customer/jobs` or embed linked job timeline in request detail.
- **Acceptance criteria:** Customer can inspect upcoming/completed job details and history from dashboard.
- **Priority:** High

### Ticket 10: Move create forms behind actions
- **Area/page:** Expenses, users, service areas, terms, checklists
- **Problem:** Create forms appear before existing data.
- **Solution:** Use PageHeader action + drawer/modal/collapsible form, modeled after customers page.
- **Acceptance criteria:** Records/lists appear first; create opens on demand; mobile drawer is accessible.
- **Priority:** Medium

### Ticket 11: Public conversion polish
- **Area/page:** `/pricing`, `/service-area`, `/contact`, quote success
- **Problem:** Some public pages lack ideal mobile conversion patterns.
- **Solution:** Add pricing cards, stronger quote CTAs, response expectation, and post-submit next actions.
- **Acceptance criteria:** Each public page has an obvious next action on mobile and desktop.
- **Priority:** Medium

### Ticket 12: Customer property management
- **Area/page:** `/customer/properties`, `/customer/account`
- **Problem:** Saved property details are visible but not easily corrected.
- **Solution:** Add property note/access edit or change-request workflow.
- **Acceptance criteria:** Customer can update gate/access/pet/hazard notes or request address changes.
- **Priority:** Medium

---

## Final Recommendation

Start with the user-flow blockers that most directly affect revenue and operations: role-aware login, quote wizard validation/accessibility, crew job detail priority, and schedule-fit guidance in admin job creation. Then standardize responsive data views and admin filters to make the platform scale cleanly with more customers, jobs, invoices, and crew activity.
