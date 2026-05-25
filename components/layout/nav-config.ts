import type { AppRole } from "@/lib/auth/session";

export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroupsByRole: Record<AppRole, NavGroup[]> = {
  admin: [
    {
      label: "Command",
      items: [{ label: "Dashboard", href: "/admin/dashboard" }],
    },
    {
      label: "Intake & Sales",
      items: [
        { label: "Quote Requests", href: "/admin/quote-requests" },
        { label: "Customers & Properties", href: "/admin/customers" },
        { label: "Estimates", href: "/admin/estimates" },
        { label: "Direct Job Entry", href: "/admin/jobs/new" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Jobs", href: "/admin/jobs" },
        { label: "Schedule", href: "/admin/schedule" },
        { label: "Open Slots", href: "/admin/schedule/slots" },
        { label: "Routes", href: "/admin/routes" },
        { label: "Map", href: "/admin/map" },
        { label: "Crew Availability", href: "/admin/crew/availability" },
        { label: "Checklists", href: "/admin/checklists" },
      ],
    },
    {
      label: "Money",
      items: [
        { label: "Invoices", href: "/admin/invoices" },
        { label: "Payments", href: "/admin/payments" },
        { label: "Expenses", href: "/admin/expenses" },
        { label: "Earnings", href: "/admin/earnings" },
      ],
    },
    {
      label: "Catalog & Site",
      items: [
        { label: "Services", href: "/admin/services" },
        { label: "Service Areas", href: "/admin/service-areas" },
        { label: "Terms", href: "/admin/terms" },
      ],
    },
    {
      label: "Administration",
      items: [
        { label: "Users & Access", href: "/admin/users" },
        { label: "Settings", href: "/admin/settings" },
      ],
    },
  ],
  crew: [
    {
      label: "Field work",
      items: [
        { label: "Today", href: "/crew/dashboard" },
        { label: "Jobs", href: "/crew/jobs" },
        { label: "Map", href: "/crew/map" },
        { label: "Earnings", href: "/crew/earnings" },
      ],
    },
  ],
  customer: [
    {
      label: "My account",
      items: [
        { label: "Dashboard", href: "/customer/dashboard" },
        { label: "Requests", href: "/customer/requests" },
        { label: "Estimates", href: "/customer/estimates" },
        { label: "Invoices", href: "/customer/invoices" },
        { label: "Properties", href: "/customer/properties" },
        { label: "Account", href: "/customer/account" },
      ],
    },
  ],
};

export const quickNavByRole: Record<AppRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Schedule", href: "/admin/schedule" },
    { label: "Map", href: "/admin/map" },
  ],
  crew: navGroupsByRole.crew[0].items,
  customer: [
    { label: "Dashboard", href: "/customer/dashboard" },
    { label: "Requests", href: "/customer/requests" },
    { label: "Invoices", href: "/customer/invoices" },
    { label: "Account", href: "/customer/account" },
  ],
};

export function getFlatNav(role: AppRole) {
  return navGroupsByRole[role].flatMap((group) => group.items);
}
