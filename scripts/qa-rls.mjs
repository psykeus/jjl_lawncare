#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD ?? "JJLdemo123!";
const users = {
  admin: { email: process.env.DEMO_ADMIN_EMAIL ?? "admin@jjllawn.local", password: process.env.DEMO_ADMIN_PASSWORD ?? demoPassword },
  crew: { email: process.env.DEMO_CREW_EMAIL ?? "crew@jjllawn.local", password: process.env.DEMO_CREW_PASSWORD ?? demoPassword },
  customer: { email: process.env.DEMO_CUSTOMER_EMAIL ?? "customer@jjllawn.local", password: process.env.DEMO_CUSTOMER_PASSWORD ?? demoPassword },
};

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and publishable/anon key. Check .env.local or exported env vars.");
  process.exit(1);
}

const checks = [];
function ok(name, details = "") {
  checks.push({ name, pass: true, details });
  console.log(`✓ ${name}${details ? ` — ${details}` : ""}`);
}
function fail(name, details = "") {
  checks.push({ name, pass: false, details });
  console.error(`✗ ${name}${details ? ` — ${details}` : ""}`);
}
function expect(name, condition, details = "") {
  if (condition) ok(name, details);
  else fail(name, details);
}

function client() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signIn(role) {
  const supabase = client();
  const { data, error } = await supabase.auth.signInWithPassword(users[role]);
  if (error) throw new Error(`${role} sign-in failed: ${error.message}`);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, role, email").eq("auth_user_id", data.user.id).maybeSingle();
  if (profileError) throw new Error(`${role} profile lookup failed: ${profileError.message}`);
  expect(`${role} profile role`, profile?.role === role, `saw ${profile?.role ?? "none"}`);
  return { supabase, profile };
}

try {
  const anonymous = client();
  const { count: visibleServices, error: servicesError } = await anonymous.from("services").select("id", { count: "exact", head: true }).eq("active", true).eq("visible_to_customer", true);
  expect("anonymous can read active visible services", !servicesError && Number(visibleServices ?? 0) > 0, servicesError?.message ?? `count=${visibleServices ?? 0}`);

  const { count: publicSettings, error: settingsError } = await anonymous.from("settings").select("key", { count: "exact", head: true }).in("key", ["business", "payment_public", "public_site"]);
  expect("anonymous can read selected public settings", !settingsError && Number(publicSettings ?? 0) > 0, settingsError?.message ?? `count=${publicSettings ?? 0}`);

  const admin = await signIn("admin");
  const crew = await signIn("crew");
  const customer = await signIn("customer");

  const { count: adminUpsells, error: adminUpsellsError } = await admin.supabase.from("service_upsells").select("id", { count: "exact", head: true });
  expect("admin can read service upsells", !adminUpsellsError && Number(adminUpsells ?? 0) > 0, adminUpsellsError?.message ?? `count=${adminUpsells ?? 0}`);

  const { count: customerRows, error: customerRowsError } = await customer.supabase.from("customers").select("id", { count: "exact", head: true });
  expect("customer can read linked customer rows", !customerRowsError && Number(customerRows ?? 0) > 0, customerRowsError?.message ?? `count=${customerRows ?? 0}`);

  const { count: customerExpenseRows, error: customerExpensesError } = await customer.supabase.from("expenses").select("id", { count: "exact", head: true });
  expect("customer cannot read expenses", !customerExpensesError && Number(customerExpenseRows ?? 0) === 0, customerExpensesError?.message ?? `count=${customerExpenseRows ?? 0}`);

  const { count: customerQuoteServices, error: customerQuoteServicesError } = await customer.supabase.from("quote_request_services").select("id", { count: "exact", head: true });
  expect("customer can read own normalized request services", !customerQuoteServicesError, customerQuoteServicesError?.message ?? `count=${customerQuoteServices ?? 0}`);

  const { count: crewCustomerRows, error: crewCustomersError } = await crew.supabase.from("customers").select("id", { count: "exact", head: true });
  expect("crew cannot list customers", !crewCustomersError && Number(crewCustomerRows ?? 0) === 0, crewCustomersError?.message ?? `count=${crewCustomerRows ?? 0}`);

  const { error: crewJobsError } = await crew.supabase.from("jobs").select("id, status", { count: "exact", head: true });
  expect("crew can query assigned jobs without RLS error", !crewJobsError, crewJobsError?.message ?? "ok");

  const { error: customerJobsError } = await customer.supabase.from("jobs").select("id, status", { count: "exact", head: true });
  expect("customer can query own jobs without RLS error", !customerJobsError, customerJobsError?.message ?? "ok");
} catch (error) {
  fail("QA script crashed", error instanceof Error ? error.message : String(error));
}

const failed = checks.filter((check) => !check.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} RLS checks passed.`);
if (failed.length) process.exit(1);
