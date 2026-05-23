-- Starter data for JJL Lawn Services
insert into public.service_categories (name, description, sort_order) values
  ('Lawn mowing', 'Mowing, trimming, edging, and blowing clippings.', 10),
  ('Yard cleanup', 'Light cleanup, debris collection, and bagging.', 20),
  ('Bed cleanup', 'Flower bed cleanup and weed pulling.', 30),
  ('Mulch', 'Mulch spreading and refresh services.', 40),
  ('Seasonal cleanup', 'Leaves, sticks, and seasonal reset work.', 50),
  ('Case-by-case', 'Services that require parent/admin approval.', 60)
on conflict do nothing;

insert into public.services (category_id, name, service_type, pricing_type, min_price, max_price, base_price, unit_label, visible_to_customer, requires_parent_approval, requires_photos, requires_site_review, recurring_capable, sort_order, public_description)
select c.id, v.name, v.service_type, v.pricing_type, v.min_price, v.max_price, v.base_price, v.unit_label, v.visible_to_customer, v.requires_parent_approval, v.requires_photos, v.requires_site_review, v.recurring_capable, v.sort_order, v.public_description
from (values
  ('Lawn mowing', 'Basic Cut', 'core', 'range', 35::numeric, 110::numeric, null::numeric, null::text, true, false, true, false, true, 10, 'Mow, basic trim, and blow clippings.'),
  ('Lawn mowing', 'Clean Cut', 'core', 'range', 50::numeric, 140::numeric, null::numeric, null::text, true, false, true, false, true, 20, 'Mow, trim, edge if included, and blow clippings.'),
  ('Yard cleanup', 'Yard Reset', 'core', 'custom_estimate', 75::numeric, null::numeric, null::numeric, null::text, true, true, true, true, false, 30, 'Light yard cleanup priced by scope.'),
  ('Mulch', 'Mulch Refresh', 'core', 'per_cubic_yard', 75::numeric, 125::numeric, null::numeric, 'cubic yard', true, false, true, true, false, 40, 'Spread customer-approved mulch.'),
  ('Case-by-case', 'Flat Concrete Pressure Washing', 'case_by_case', 'custom_estimate', 75::numeric, null::numeric, null::numeric, null::text, false, true, true, true, false, 50, 'Limited flat-surface concrete pressure washing only.'),
  ('Lawn mowing', 'Edging', 'add_on', 'flat', null::numeric, null::numeric, 15::numeric, null::text, true, false, false, false, true, 100, 'Add edging where safe and accessible.'),
  ('Lawn mowing', 'Overgrown Grass Surcharge', 'add_on', 'custom_estimate', 20::numeric, null::numeric, null::numeric, null::text, true, true, true, false, false, 110, 'Added charge for unusually tall grass.'),
  ('Yard cleanup', 'Stick Pickup', 'add_on', 'custom_estimate', 15::numeric, null::numeric, null::numeric, null::text, true, false, true, false, false, 120, 'Ground-level stick and small branch pickup.'),
  ('Bed cleanup', 'Extra Weed Pulling', 'add_on', 'custom_estimate', 20::numeric, null::numeric, null::numeric, null::text, true, false, true, false, false, 130, 'Extra hand weeding by scope.'),
  ('Yard cleanup', 'Debris Bagging', 'add_on', 'per_unit', null::numeric, null::numeric, 5::numeric, 'bag', true, false, true, false, false, 140, 'Bagging light yard debris.'),
  ('Yard cleanup', 'Dog Waste Cleanup', 'add_on', 'custom_estimate', 25::numeric, null::numeric, null::numeric, null::text, true, true, true, true, false, 150, 'Separate service only; requires approval.'),
  ('Case-by-case', 'Tree trimming', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 200, 'Not offered.'),
  ('Case-by-case', 'Chainsaw work', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 210, 'Not offered.'),
  ('Case-by-case', 'Roof/gutter work', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 220, 'Not offered.'),
  ('Case-by-case', 'Chemical weed killer', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 230, 'Not offered.')
) as v(category_name, name, service_type, pricing_type, min_price, max_price, base_price, unit_label, visible_to_customer, requires_parent_approval, requires_photos, requires_site_review, recurring_capable, sort_order, public_description)
join public.service_categories c on c.name = v.category_name
on conflict do nothing;

insert into public.terms_versions (title, version, body, effective_date, active, required_for_quote_request, required_for_estimate_acceptance) values
('Default Customer Terms', '1.0', 'Payment is due upon completion. Customer must clear yard before service. Pets must be secured. Hidden objects are customer responsibility. Weather may delay service. Unsafe jobs may be declined. No chemical application, ladder, roof, tree, or chainsaw work. Before/after photos may be used for private job documentation. Customer information will not be publicly shared.', current_date, true, true, true)
on conflict do nothing;

insert into public.checklist_templates (name, active) values
  ('Default mowing checklist', true),
  ('Default cleanup checklist', true)
on conflict do nothing;

insert into public.checklist_items (checklist_template_id, label, required, sort_order)
select t.id, v.label, true, v.sort_order
from public.checklist_templates t
join (values
  ('Default mowing checklist', 'Yard checked for objects', 10),
  ('Default mowing checklist', 'Pets secured', 20),
  ('Default mowing checklist', 'Before photos taken', 30),
  ('Default mowing checklist', 'Mowed', 40),
  ('Default mowing checklist', 'Trimmed', 50),
  ('Default mowing checklist', 'Clippings blown', 60),
  ('Default mowing checklist', 'After photos taken', 70),
  ('Default cleanup checklist', 'Scope reviewed', 10),
  ('Default cleanup checklist', 'PPE used', 20),
  ('Default cleanup checklist', 'Unsafe items checked', 30),
  ('Default cleanup checklist', 'Before photos taken', 40),
  ('Default cleanup checklist', 'Debris collected', 50),
  ('Default cleanup checklist', 'Area swept', 60),
  ('Default cleanup checklist', 'After photos taken', 70)
) as v(template_name, label, sort_order) on t.name = v.template_name
on conflict do nothing;

insert into public.settings (key, value_json) values
  ('business', '{"businessName":"JJL Lawn Services","serviceAreaDescription":"Nearby neighborhoods only","businessStatus":"active"}'::jsonb),
  ('payment_public', '{"acceptCash":true,"acceptVenmo":true,"venmoHandle":"","cashInstructions":"Cash due upon completion."}'::jsonb),
  ('document', '{"estimatePrefix":"EST-","invoicePrefix":"JLC-","startingNumber":1,"defaultEstimateExpirationDays":14,"defaultInvoiceDueDays":0}'::jsonb),
  ('tax_reserve', '{"salesTaxEnabled":false,"salesTaxRate":0,"salesTaxLabel":"Sales tax","equipmentReservePercent":10,"taxSavingsReservePercent":15,"defaultSplitMethod":"equal"}'::jsonb),
  ('parent_approval', '{"jobDollarThreshold":225,"requireHighRiskApproval":true}'::jsonb),
  ('public_site', '{"headline":"Simple lawn mowing and light yard cleanup from a local student crew."}'::jsonb)
on conflict (key) do update set value_json = excluded.value_json;
