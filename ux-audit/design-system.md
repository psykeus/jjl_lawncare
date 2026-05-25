# JJL Lawncare frontend design system/accessibility/responsiveness audit

Date: 2026-05-24

Scope inspected: shared layout/component files, nav config, global CSS, UI primitives, status badges, headers, app shell, public/mobile menus, and representative public/admin/crew/customer routes. `plan.md` and `progress.md` were requested as inputs but are not present at `/home/psykeus/jjl_lawn_services/`.

Validation run: `npm run lint` and `npm run typecheck` both completed successfully.

## What is working well

- **Shared UI foundation exists.** Core primitives (`Button`, `Card`, `Input`, `Badge`, `Alert`, `StatCard`) and layouts (`AppShell`, `PageHeader`, public header/menu) are centralized rather than duplicated (`components/ui/button.tsx:10`, `components/ui/card.tsx:4`, `components/layout/app-shell.tsx:8`, `components/layout/page-header.tsx:4`).
- **Theme tokens and dark mode are in place.** Global CSS defines semantic color variables for light/dark themes and a shared focus utility (`app/globals.css:3`, `app/globals.css:25`, `app/globals.css:71`). The root layout applies stored/system theme before rendering (`app/layout.tsx:14`).
- **Mobile-first app shell is partially implemented.** Authenticated layouts add bottom padding for fixed mobile nav (`components/layout/app-shell.tsx:10`) and a safe-area-aware bottom nav (`components/layout/app-nav.tsx:135`, `app/globals.css:87`).
- **Admin list pages avoid tiny desktop tables on phones.** Jobs and quote requests render card lists on small screens and only show wide tables at `md` and up (`app/admin/jobs/page.tsx:33`, `app/admin/jobs/page.tsx:57`; `app/admin/quote-requests/page.tsx:27`, `app/admin/quote-requests/page.tsx:51`).
- **Status badges include text, not color alone.** `StatusBadge` maps statuses to variants while rendering normalized text (`components/status/status-badge.tsx:8`, `components/status/status-badge.tsx:20`).

## Priority findings and actionable tickets

### P1 — Fix mobile/menu accessibility semantics and focus management

**Evidence**
- Authenticated menu opens an absolutely positioned dropdown with `role="menu"` (`components/layout/app-nav.tsx:108`) but its children are regular Next links without `role="menuitem"` or menu keyboard behavior (`components/layout/app-nav.tsx:118-123`). This is a disclosure/navigation menu, not an ARIA application menu.
- The authenticated menu closes on outside pointer and Escape (`components/layout/app-nav.tsx:79-98`) but does not move focus into the panel on open or return focus to the trigger on close (`components/layout/app-nav.tsx:101-125`).
- Public mobile menu uses `role="dialog"` and `aria-modal="true"` (`components/layout/public-mobile-menu.tsx:28`) but has no Escape handler, focus trap, initial focus, or focus restoration (`components/layout/public-mobile-menu.tsx:18-55`).

**Ticket**
- Replace `role="menu"` with a semantic disclosure/nav pattern for authenticated navigation, or implement full WAI-ARIA menu behavior if truly needed.
- Add focus management to both menus: focus first actionable element/title on open, close on Escape, trap tab focus while modal dialog is open, restore focus to the trigger on close, and prevent background interaction for the modal public menu.
- Add automated/keyboard QA acceptance criteria: open menu with keyboard, tab through all links, Escape closes, focus returns to trigger, screen reader announces dialog/menu purpose.

### P1 — Make the quote wizard controls semantically stateful and screen-reader operable

**Evidence**
- Service cards are toggle buttons with only visual selected state and text (`Selected`/`Choose`), but no `aria-pressed` or checkbox/radio semantics (`app/(public)/request-quote/request-quote-wizard.tsx:170-188`).
- Yes/no and option chips are buttons that visually indicate state but do not expose `aria-pressed`, `aria-checked`, or radio/checkbox grouping (`app/(public)/request-quote/request-quote-wizard.tsx:202-215`).
- Step navigation buttons expose the current step visually only and do not use `aria-current`, `aria-controls`, or a progress/list pattern (`app/(public)/request-quote/request-quote-wizard.tsx:229-232`).
- The form disables browser validation with `noValidate` (`app/(public)/request-quote/request-quote-wizard.tsx:226`) while many required controls are custom button groups, so users depend on custom state and server-side feedback.

**Ticket**
- Model service selection as checkbox cards (`input type="checkbox"` visually styled) or add `aria-pressed` to toggle buttons.
- Model single-choice/yes-no as radio groups and multi-choice as checkboxes, with `fieldset`/`legend` or equivalent accessible names.
- Add `aria-current="step"` or an accessible stepper pattern for the wizard progress controls.
- Keep visual card/chip UI, but ensure native inputs or ARIA states are submitted and announced correctly.

### P1 — Raise tap target sizes for mobile-first interactions

**Evidence**
- Shared button sizes are `h-9` (36px), `h-10` (40px), and `h-12` (48px) (`components/ui/button.tsx:18-21`). The `sm` and `md` defaults fall below common mobile SaaS target guidance of ~44px for primary touch controls.
- Public/app menu triggers use `size="sm"` (`components/layout/public-mobile-menu.tsx:23`, `components/layout/app-nav.tsx:103`).
- Wizard step pills use `py-1` and no min-height (`app/(public)/request-quote/request-quote-wizard.tsx:229-232`), and question chips use `py-2` with no min-height (`app/(public)/request-quote/request-quote-wizard.tsx:203-215`).

**Ticket**
- Set mobile/default control min-height to at least 44px for buttons, menu triggers, stepper controls, chips, and checkbox/radio rows. If compact density is needed on desktop, apply smaller sizes only at larger breakpoints.
- Add min-width/min-height token utilities (e.g., `touch-target`) and use them consistently in UI primitives.

### P2 — Add skip links and stronger page landmarks for keyboard users

**Evidence**
- Public layout renders `PublicHeader` followed by `<main>` but no skip-to-content link (`app/(public)/layout.tsx:5-8`).
- Authenticated app shell renders sticky header and `<main>` but no skip link or `id` target (`components/layout/app-shell.tsx:11-27`).

**Ticket**
- Add a visually hidden/focus-visible “Skip to main content” link before each sticky header.
- Add `id="main-content"` to the main landmark in public and authenticated layouts.
- Ensure the skip link appears above sticky headers and has the same visible focus treatment as other controls.

### P2 — Strengthen focus indicators in light mode

**Evidence**
- The shared focus style uses `outline: 3px solid var(--ring)` (`app/globals.css:71-73`). In light mode `--ring` is `rgba(47, 107, 59, 0.35)` (`app/globals.css:18`), which blends to a low-contrast pale green on white/card backgrounds.
- Focusable primitives depend on this utility (`components/ui/button.tsx:28`, `components/ui/input.tsx:9`, `components/layout/app-nav.tsx:28`).

**Ticket**
- Use an opaque or higher-contrast focus token for light mode (for example, primary at full strength plus outline-offset, or a two-ring focus style). Target WCAG 2.2 focus appearance contrast.
- Test focus visibility on card, muted, primary, and dark backgrounds.

### P2 — Convert feedback/status messages to live, semantic announcements

**Evidence**
- `Alert` is a visual `div` with no default `role`, `aria-live`, or heading support (`components/ui/alert.tsx:13`).
- Wizard upload/server errors render plain `div`s (`app/(public)/request-quote/request-quote-wizard.tsx:234-235`).
- Address service-area feedback and autocomplete errors render visual `div`s but are not live regions (`app/(public)/request-quote/request-address-fields.tsx:141-143`).

**Ticket**
- Update the shared `Alert` primitive to support `role="alert"` for errors and `role="status"`/`aria-live="polite"` for non-blocking success/info messages.
- Replace ad-hoc tone `div`s with `Alert` so feedback is announced consistently.
- For form errors, associate messages to fields via `aria-describedby` where possible.

### P2 — Improve desktop SaaS navigation discoverability

**Evidence**
- Admin has many grouped routes in nav config (Dashboard plus intake, operations, money, catalog, administration; `components/layout/nav-config.ts:13-63`).
- Authenticated app shell only renders brand, user/theme/sign-out, and `MobileNavButton` in the header (`components/layout/app-shell.tsx:11-23`); there is no persistent desktop sidebar/top nav. The menu trigger itself has no `lg:hidden`, so desktop users still navigate through a dropdown (`components/layout/app-nav.tsx:101-108`).

**Ticket**
- Add a persistent desktop sidebar or horizontal app nav for `lg+`, with grouped admin sections and visible current state.
- Keep bottom nav for mobile quick actions, but reserve the disclosure menu for secondary/overflow routes.
- Define role-specific primary routes intentionally rather than relying only on the first four flattened items.

### P2 — Finish responsive data-table patterns for customer-facing detail views

**Evidence**
- Admin list pages have mobile cards plus desktop tables (`app/admin/jobs/page.tsx:33-58`), but customer estimate detail uses only an overflow wrapper and a `w-full` table with no `min-w` or stacked/card alternative (`app/customer/estimates/[id]/page.tsx:64-77`).

**Ticket**
- Standardize a `ResponsiveTable`/`DataList` pattern: mobile cards or definition-list rows below `md`, table with `min-w-*` above.
- Apply it to estimate/invoice line items and any other customer-facing financial tables so totals remain readable on 320-390px screens.

### P2 — Make form field help/error text programmatically associated

**Evidence**
- `Field` wraps controls in a `<label>` and renders hint text visually, but it does not generate ids or wire `aria-describedby` (`components/ui/input.tsx:43-49`).
- Many important instructions are delivered through `Field` hints, including address autocomplete/service-area guidance (`app/(public)/request-quote/request-address-fields.tsx:130-139`) and photo upload limits (`app/(public)/request-quote/request-quote-wizard.tsx:299-300`).

**Ticket**
- Extend `Field` to accept/generate `id`, `hint`, `error`, and `required` metadata; clone or render controls with `aria-describedby` and `aria-invalid`.
- Prefer a `FieldControl` pattern for complex fields where wrapping labels is not sufficient.

### P3 — Expand design tokens beyond colors to improve consistency and maintainability

**Evidence**
- Global tokens cover colors, focus ring, container width, safe-bottom, and tone backgrounds (`app/globals.css:3-109`).
- Components still hard-code many radii, shadows, type sizes, spacing, and arbitrary values such as `rounded-3xl`, `text-[0.68rem]`, `tracking-[0.18em]`, `w-[min(92vw,380px)]`, and `min-w-[860px]` (`components/layout/app-nav.tsx:53`, `components/layout/app-nav.tsx:108`, `app/admin/jobs/page.tsx:58`).

**Ticket**
- Define documented design-system tokens/utilities for type scale, touch targets, radii, shadows/elevation, page gutters, card spacing, table min-widths, and status tones.
- Create a small component usage guide for SaaS screens: page header + action bar, mobile card list + desktop table, empty state, alert, form section, stat grid.

### P3 — Improve selected-state and status naming resilience

**Evidence**
- `StatusBadge` compares raw status strings against fixed lowercase sets (`components/status/status-badge.tsx:3-18`) and prints `normalized.replaceAll("_", " ")` (`components/status/status-badge.tsx:20`).

**Ticket**
- Normalize status values with `trim().toLowerCase()` before lookup and expose a typed status/label map for known domains (jobs, invoices, requests, risk).
- Consider title-cased display labels and optional icons for faster scanning while keeping text labels.

## Suggested execution order

1. **Accessibility foundations:** menu/dialog focus management, quote wizard semantics, alert/live regions, skip links.
2. **Mobile ergonomics:** touch target token, stepper/chip/button sizing, field association.
3. **Responsive SaaS shell:** persistent desktop nav, standardized responsive table/data-list primitive.
4. **Design-system polish:** token documentation, status maps, component usage recipes.
