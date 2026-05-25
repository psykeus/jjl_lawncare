# JJL Lawncare UX/UI Audit — Public + Auth + Customer

Date: 2026-05-24

Scope inspected: public routes under `app/(public)`, quote wizard, auth login/signup/callback/update-password, customer dashboard/requests/estimates/invoices/properties/account, and shared layout/components. `plan.md` and `progress.md` were requested but are not present at repo root. Validation run: `npm run lint` ✅, `npm run typecheck` ✅.

## What is working well

- Public IA is simple and task-focused: Services, Pricing, Service Area, Terms, Contact, Login, and Request Quote are exposed in the sticky public header (`components/layout/public-header.tsx:7-35`) and mobile drawer (`components/layout/public-mobile-menu.tsx:9-52`).
- Public content is backed by admin-managed data instead of hard-coded service/pricing lists: homepage services (`app/(public)/page.tsx:21-67`), services (`app/(public)/services/page.tsx:41-64`), pricing (`app/(public)/pricing/page.tsx:20-40`), service areas (`app/(public)/service-area/page.tsx:35-54`), and terms (`app/(public)/terms/page.tsx`).
- Quote request flow has a clear four-step mental model and service-specific details/photos (`app/(public)/request-quote/request-quote-wizard.tsx:67`, `225-341`).
- Customer portal has a coherent shell with dashboard stats, request/estimate/invoice/property/account destinations, status badges, and mobile bottom navigation (`components/layout/nav-config.ts:80-85`, `components/layout/app-nav.tsx:130-154`).
- Dark mode foundation is in place via CSS variables and early theme script (`app/globals.css:3-39`, `app/layout.tsx:8-19`) with toggles in public/app shells.

## Priority findings and actionable tickets

### P1 — Fix password-login destination for customers

**Evidence:** The password login form does not submit a `redirectTo` value (`app/auth/login/page.tsx:25-32`), while `signInWithPassword` defaults to `/admin/dashboard` (`lib/auth/actions.ts:6-15`). Non-admin users hitting an admin-only layout are redirected to `/` (`lib/auth/session.ts:34-38`, `app/admin/layout.tsx:4-6`).

**Impact:** A customer who chooses password login can successfully authenticate but land on the public home page instead of the customer dashboard, making login appear broken.

**Ticket:** Make post-login role-aware. After password auth, read the profile role and redirect admin → `/admin/dashboard`, crew → `/crew/dashboard`, customer → `/customer/dashboard`. If role is unavailable/inactive, show a clear auth error instead of falling through to `/`.

---

### P1 — Add real step validation and progress preservation to the quote wizard

**Evidence:** The form disables browser validation with `noValidate` (`app/(public)/request-quote/request-quote-wizard.tsx:225-227`). Users can jump to any step via step buttons (`229-232`), advance from Address without checking required fields (`237-245`), and only server-side redirects surface missing fields (`app/(public)/request-quote/actions.ts:198-200`). Redirecting back to `/request-quote?error=...` resets client wizard state and file inputs.

**Impact:** Users can reach submit with missing address/contact/terms data, then lose work after a server redirect. This is especially costly after selecting services, answering questions, and attaching photos.

**Ticket:** Implement per-step validation before allowing navigation forward. Keep users on the failing step, focus the first invalid field, and preserve entered data. Consider removing `noValidate` or replacing it with accessible custom validation tied to the current step.

---

### P1 — Honor service-level photo requirements in the customer UI

**Evidence:** Services include `requires_photos` (`app/(public)/request-quote/request-quote-wizard.tsx:47`), but the Details copy says photos are optional (`273-275`) and every photo field label says optional (`299-300`). The server action fetches `requires_photos` (`app/(public)/request-quote/actions.ts:207-209`) but only validates file type/size, not presence (`226-233`).

**Impact:** Admin-configured services that require photos are presented as optional to customers, causing incomplete quote requests and follow-up friction.

**Ticket:** For selected services with `requires_photos`, label photos as required, block Details/Submit until at least one image is attached for that service, and mirror the requirement in server validation.

---

### P1 — Add accessible selection semantics to the quote wizard

**Evidence:** Service cards are plain buttons with visual selected state only (`app/(public)/request-quote/request-quote-wizard.tsx:170-188`). Yes/no and option chips also use visual state without `aria-pressed`, radio/checkbox roles, or grouped labels (`202-215`). Step buttons have no `aria-current` or disabled/complete state (`229-232`).

**Impact:** Screen-reader and keyboard users receive weak feedback about what is selected, what step they are on, and which choices are required.

**Ticket:** Add `aria-pressed` for toggle buttons or convert choices to real checkbox/radio inputs inside `fieldset`/`legend`. Mark the active step with `aria-current="step"`, expose completed/error states, and ensure error messages are announced.

---

### P2 — Gate the address/service-area check more clearly

**Evidence:** Google Places selection triggers `checkArea` (`app/(public)/request-quote/request-address-fields.tsx:102-119`), and city/ZIP blur triggers checks (`137-139`), but Address Line 1 edits do not. The Address step can advance regardless of check result (`app/(public)/request-quote/request-quote-wizard.tsx:237-245`), and outside-area rejection only happens after submit (`app/(public)/request-quote/actions.ts:216-224`).

**Impact:** Customers may spend time completing details only to be rejected after submit.

**Ticket:** Show an explicit “Unchecked / Checking / In service area / Outside area” state, auto-check saved/default manual addresses, and block forward progress when required address fields are empty or the latest area result is outside the service area.

---

### P2 — Add empty-state handling when no requestable services are configured

**Evidence:** The Services step renders core/case-by-case maps without fallback (`app/(public)/request-quote/request-quote-wizard.tsx:247-255`), then disables “Next: answer details” if none are selected (`265-268`).

**Impact:** If the service catalog is empty/misconfigured, the user sees a dead-end wizard with no explanation or alternate contact path.

**Ticket:** Add an empty state with “Services are being updated” copy and actions to contact/request help; optionally disable entry to the wizard until services exist.

---

### P2 — Improve quote-request success recovery and next actions

**Evidence:** The submitted state only thanks the user and mentions follow-up (`app/(public)/request-quote/page.tsx:16-24`). There is no CTA to return home, submit another request, or log in/view dashboard.

**Impact:** The flow ends abruptly, especially for signed-in customers who could continue to their dashboard.

**Ticket:** Add clear next actions: “Go to customer dashboard” for signed-in users, “Submit another request,” and “Back to home/services.”

---

### P2 — Clarify customer job IA and detail routes

**Evidence:** Customer nav includes Dashboard, Requests, Estimates, Invoices, Properties, Account, but no Jobs route (`components/layout/nav-config.ts:80-85`). The dashboard has “Next scheduled work” and “Job tracker,” but links users to `/customer/requests` rather than a job detail (`app/customer/dashboard/page.tsx:43-67`). Job rows themselves are not links (`73-83`).

**Impact:** Once work is scheduled, customers do not have a direct place to inspect job details/status/checklist/photos; jobs are conceptually hidden under Requests.

**Ticket:** Either add customer job detail routes (`/customer/jobs/[id]`) and nav, or make the Requests detail page explicitly include linked job status/history when a request converts to a job.

---

### P2 — Show multi-service requests consistently in customer summaries

**Evidence:** The customer requests list fetches only the legacy `quote_requests.services(name)` relationship (`app/customer/requests/page.tsx:12-15`) and displays one service name (`31-35`). The detail route separately queries `quote_request_services` and can show multiple services (`app/customer/requests/[id]/page.tsx:39-43`). Dashboard recent requests also uses one service (`app/customer/dashboard/page.tsx:91-99`).

**Impact:** A request containing mowing plus add-ons can appear as a single service or generic “Quote request” in summaries, reducing confidence that all selections were captured.

**Ticket:** Query and display `quote_request_services` in dashboard/list cards, e.g. “Mowing + 2 add-ons,” with the full list in the detail page.

---

### P2 — Make saved properties manageable, not just readable

**Evidence:** `/customer/properties` renders property cards and an empty state only (`app/customer/properties/page.tsx:10-46`). `/customer/account` only updates profile name/phone (`app/customer/account/page.tsx:23-29`; `app/customer/account/actions.ts:12-21`).

**Impact:** Customers cannot correct gate, pet, hazard, address-line-2, or inactive property details except by submitting another quote request.

**Ticket:** Add an edit property flow for non-geocritical notes at minimum (gate/access, pets, hazards, yard size). If address changes require admin review, expose that limitation and provide a request-change action.

---

### P2 — Improve invoice/estimate details on mobile and with navigation

**Evidence:** Estimate and invoice listing pages provide mobile card alternatives (`app/customer/estimates/page.tsx:19-42`, `app/customer/invoices/page.tsx:19-43`), but detail pages use tables only (`app/customer/estimates/[id]/page.tsx:64-78`, `app/customer/invoices/[id]/page.tsx:28-33`) and have no back link to their list pages (`app/customer/estimates/[id]/page.tsx:47-53`, `app/customer/invoices/[id]/page.tsx:22-27`).

**Impact:** Detail pages are less mobile-friendly than the list pages and can feel like a dead end after review/payment.

**Ticket:** Add a back link/breadcrumb, mobile card rendering for line items/totals, and a sticky/summary acceptance/payment instruction area for long estimates/invoices.

---

### P2 — Handle auth callback/update-password failures with user-facing states

**Evidence:** The auth callback exchanges a code but ignores exchange errors and redirects either way (`app/auth/callback/route.ts:9-14`). Update password has validation errors but no surrounding auth context/navigation (`app/auth/update-password/page.tsx`).

**Impact:** Expired or invalid magic links can land users in the dashboard/login loop without a clear explanation.

**Ticket:** Check `exchangeCodeForSession` errors and redirect to `/auth/login?error=...` with a friendly “Link expired; request a new one” action. Add logo/home/login links to auth pages for recovery.

---

### P2 — Add focus management to mobile menus/dialogs

**Evidence:** Public mobile menu opens a `role="dialog"` overlay (`components/layout/public-mobile-menu.tsx:27-54`) but does not trap focus, move focus into the dialog, or restore focus on close. The app-shell menu listens for Escape/outside click (`components/layout/app-nav.tsx:84-98`) but also lacks focus trapping (`101-125`).

**Impact:** Keyboard users can tab behind open overlays, and screen-reader users may not be placed in the opened menu.

**Ticket:** On open, focus the close button or first link; trap tab focus inside the menu; restore focus to the triggering button on close.

---

### P3 — Polish public-page mobile layouts and CTAs

**Evidence:** Pricing uses a horizontally scrollable 720px table on all small screens (`app/(public)/pricing/page.tsx:26-40`), while customer estimate/invoice lists already use mobile cards. Service Area explains checking but has no direct CTA (`app/(public)/service-area/page.tsx:28-54`). Contact only routes to quote request (`app/(public)/contact/page.tsx`).

**Impact:** Public users on phones get more friction than customer users, and service-area/contact pages do not always provide the next best action.

**Ticket:** Add pricing cards on mobile, add “Request a quote” CTA to Service Area, and consider adding basic contact expectations (response time, email/phone if available) on Contact.
