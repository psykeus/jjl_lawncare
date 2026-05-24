"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createCustomerAndProperty } from "./actions";

export function CreateCustomerDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Add customer</Button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Add customer">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close add customer form" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(100vw,720px)] flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-4 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Customers</p>
                <h2 className="text-2xl font-black">Add customer</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Create the customer, optional login, and their first service property.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close add customer form" className="px-2">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <form action={createCustomerAndProperty} className="grid gap-5 overflow-y-auto p-4 sm:p-6">
              <section className="grid gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Customer</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Customer name"><Input name="name" required /></Field>
                  <Field label="Email"><Input name="email" type="email" required /></Field>
                  <Field label="Phone"><Input name="phone" /></Field>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                  <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 text-sm font-semibold">
                    <input type="checkbox" name="createAccount" />
                    Create customer login account
                  </label>
                  <Field label="Temporary password"><Input name="password" type="text" placeholder="Optional; auto-generated if blank" /></Field>
                </div>
                <Field label="Customer notes"><Textarea name="notes" /></Field>
              </section>

              <section className="grid gap-4 border-t border-[var(--border)] pt-5">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Property</h3>
                <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.5fr_0.5fr]">
                  <Field label="Address"><Input name="addressLine1" required /></Field>
                  <Field label="City"><Input name="city" required /></Field>
                  <Field label="State"><Input name="state" defaultValue="MO" required /></Field>
                  <Field label="ZIP"><Input name="zip" required /></Field>
                </div>
                <Field label="Address line 2"><Input name="addressLine2" /></Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Yard size"><Select name="yardSize"><option value="">Unknown</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="extra_large">Extra large</option></Select></Field>
                  <Field label="Gate notes"><Input name="gateNotes" /></Field>
                  <Field label="Pet notes"><Input name="petNotes" /></Field>
                </div>
                <Field label="Hazard notes"><Textarea name="hazardNotes" /></Field>
                <Field label="Access notes"><Textarea name="accessNotes" /></Field>
              </section>

              <div className="sticky bottom-0 -mx-4 -mb-4 grid gap-2 border-t border-[var(--border)] bg-[var(--card)] p-4 sm:-mx-6 sm:-mb-6 sm:flex sm:justify-end sm:p-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create customer</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
