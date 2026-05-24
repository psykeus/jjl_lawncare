# JJL Lawncare Expansion Buildout Plan

## Goal

Move the app from a working MVP into a systematic service catalog, customer request wizard, managed service-area checker, internal job map, scheduling assistant, and route-planning platform for Greater Cincinnati and surrounding areas.

## 1. Tie admin-created services to public pages

### Current need

Admin services should be the source of truth for the homepage, services page, pricing page, request form service choices, upsells, duration estimates, and scheduling workload assumptions.

### Service catalog fields to add over time

```text
featured_on_homepage
homepage_title
homepage_summary
homepage_sort_order
public_card_icon
upsell_service_ids
estimated_duration_minutes
estimated_crew_size
service_area_required
```

### Public behavior

Homepage should show:

- Featured core services
- Short descriptions from admin service records
- Starting/range pricing if public
- “Request this service” buttons that preselect the service on the request form

Services page should show:

- Core services
- Add-ons
- Case-by-case services
- Public exclusions, if visible

## 2. Service-area management

### Goal

Only accept and map work in Greater Cincinnati and surrounding service areas unless an admin intentionally overrides.

### Proposed model

```text
service_areas
- id
- name
- type: zip | city | county | radius | polygon
- zip_codes[]
- cities[]
- center_lat
- center_lng
- radius_miles
- polygon_geojson
- active
- outside_area_message
```

### MVP approach

Start with a Greater Cincinnati allowlist using ZIP/city/radius/bounding-box checks, then add polygon boundaries later.

Initial area examples:

- Cincinnati
- Norwood
- Blue Ash
- Mason
- Loveland
- Milford
- Madeira
- Indian Hill
- Mariemont
- Anderson
- West Chester
- Fairfield
- Covington/Newport if desired

### Request form behavior

1. Customer starts typing address.
2. Google Places Autocomplete suggests/normalizes address.
3. App geocodes address.
4. App checks if address is inside active service area.
5. If outside:
   - Show friendly warning.
   - Either block submission or allow outside-area waitlist depending admin setting.

## 3. Simpler customer request form

Replace the long quote form with a step-by-step wizard.

### Step 1 — Address

- Google Places Autocomplete
- Auto-fill street/city/state/ZIP
- Validate service area immediately
- Show outside-area message before the customer finishes the form

### Step 2 — Choose service

Show clickable service cards such as:

```text
Mow Lawn
Yard Cleanup
Mulch
Weeding
Other
```

When a core service is selected, show optional upsells:

```text
Add edging?
Add stick pickup?
Add bagging?
```

### Step 3 — Service-specific questions

Questions and button answers should be admin-managed.

Example:

```text
Service: Mow Lawn
Question: How large is the area?
Answers:
- Less than 1/4 acre
- 1/4 to 1/2 acre
- More than 1/2 acre

Question: How tall is the grass?
Answers:
- 6 inches or less
- Over 6 inches
```

### Step 4 — Photos and notes per service

Each selected service gets:

- Notes
- Photo uploads
- Service-specific answers

Example data shape:

```json
[
  {
    "serviceId": "mow-lawn",
    "answers": {
      "yard_size": "less_than_quarter_acre",
      "grass_height": "over_6_inches"
    },
    "notes": "Backyard is taller than front.",
    "photos": []
  }
]
```

### Step 5 — Easy login/contact

Use the simplest practical customer auth:

- Email magic link/passwordless login preferred
- Or simple email + phone + name on first request
- Auto-create customer record behind the scenes

## 4. Admin-managed service question system

### Proposed tables

```text
service_questions
- id
- service_id
- question_text
- question_type: single_choice | multi_choice | yes_no | short_text | number
- required
- sort_order
- active

service_question_options
- id
- question_id
- label
- value
- price_modifier
- duration_modifier_minutes
- risk_modifier
- requires_parent_approval
- sort_order
- active
```

This lets admins control:

- Which questions appear per service
- Button-answer choices
- Price impact
- Time estimate impact
- Risk/approval impact

Example:

```text
Grass over 6 inches:
+ $20
+ 20 minutes
risk = medium
requires approval = maybe
```

## 5. Better quote/request data model

Instead of a quote request having one requested service, support multiple selected services.

### Proposed tables

```text
quote_request_services
- id
- quote_request_id
- service_id
- notes
- estimated_duration_minutes
- estimated_price_min
- estimated_price_max
- sort_order

quote_request_service_answers
- id
- quote_request_service_id
- question_id
- option_id
- answer_text

quote_request_service_photos
- id
- quote_request_service_id
- media_file_id
```

This cleanly ties together:

- Selected service
- Answers
- Photos
- Notes
- Estimate items
- Job workload planning

## 6. Internal map improvements

### Map scope

Only show/admin-plan jobs in the configured Greater Cincinnati/surrounding service area unless the admin explicitly enables outside-area jobs.

### Pin groups/colors

Use clear operational groups:

```text
Current jobs: green/orange
Queue/upcoming jobs: blue
Past jobs: gray
Problem/overdue jobs: red, optional later
```

Suggested grouping:

Current:

- on_the_way
- in_progress
- scheduled today

Queue:

- accepted
- scheduled future
- on_hold

Past:

- completed
- completed_unpaid
- paid

### Pin detail should show

- Customer
- Address
- Requested work
- Selected services
- Service-specific answers
- Photos
- Estimated duration
- Assigned crew
- Scheduled window
- Job status
- Open job button

## 7. Routing and scheduling system

### Required job fields

```text
estimated_duration_minutes
required_crew_size
earliest_start_at
latest_end_at
preferred_time_window
route_priority
service_area_id
```

### Crew availability fields

```text
crew_availability
- id
- profile_id
- available_date
- start_time
- end_time
- max_hours
- active
```

Optional later:

```text
crew_skills
- profile_id
- service_id
```

### Route planning inputs

For a selected day:

- Scheduled and queue jobs
- Job location
- Estimated duration
- Required crew size
- Crew availability
- Customer preferred windows
- Travel time between jobs
- Start/end depot/home base

### Google APIs

Use one of:

```text
Routes API / Route Matrix API
```

or legacy:

```text
Distance Matrix API + Directions API
```

### MVP scheduling logic

1. Group jobs by day.
2. Filter crew available that day.
3. Calculate total crew-hours available.
4. Calculate job workload as estimated duration × required crew size.
5. Add travel buffer between jobs.
6. Sort by time windows, geography, and priority.
7. Build route.
8. Detect capacity and route conflicts.

### Admin output

Example day summary:

```text
Available crew-hours: 12
Scheduled workload: 9.5
Travel buffer: 1.8
Remaining capacity: 0.7
Status: Nearly full
```

Warnings:

```text
Tuesday is overbooked by 1.5 hours.
Job #123 cannot fit in its requested window.
Need 2 crew members, only 1 available.
```

### Suggested route timeline

```text
9:00 AM - 9:15 AM Travel to Job 1
9:15 AM - 10:15 AM Mow Lawn - Smith
10:15 AM - 10:30 AM Travel to Job 2
10:30 AM - 12:00 PM Yard Cleanup - Jones
12:00 PM - 12:30 PM Buffer/lunch
```

## 8. Available time-slot finder

When an admin schedules a new job, the app should suggest slots.

Inputs:

- Estimated duration
- Required crew size
- Customer preferred dates/windows
- Location
- Existing route
- Crew availability

Output:

```text
Best available slots:
1. Friday 9:30–10:45 AM — adds 8 minutes travel
2. Friday 2:00–3:15 PM — adds 14 minutes travel
3. Saturday 10:00–11:15 AM — route already nearby
```

Also show:

```text
No good slots this week.
Next available: Monday 10:30 AM.
```

## 9. Admin screens to add

```text
/admin/service-areas
/admin/services/[id]/questions
/admin/schedule
/admin/routes
/admin/crew/availability
```

### Admin service areas

- Manage ZIP/city/radius/polygon areas
- Turn areas on/off
- Set public message for outside area

### Admin service questions

- Add questions per service
- Add button options
- Attach price/time/risk effects

### Admin schedule board

- Calendar/day view
- Jobs by queue/scheduled/current/past
- Overbooking warnings
- Suggested slots

### Admin route board

- Map pins
- Route sequence
- Crew assignment
- Estimated travel/time
- Capacity warnings

### Crew availability

- Set availability by day
- Max hours
- Skills/services if needed

## Recommended build order

### Phase 1 — Foundation

1. Tie homepage/services/pricing pages to admin service records.
2. Add service areas table/admin page.
3. Add Google Places Autocomplete to request form.
4. Add service-area validation.

### Phase 2 — Request form rebuild

1. Replace request form with wizard.
2. Add service cards.
3. Add upsells.
4. Add service questions/options.
5. Add per-service notes/photos.

### Phase 3 — Map upgrade

1. Add pin status groups/colors.
2. Add filters: current / queue / past.
3. Add richer pin detail.
4. Restrict visible map jobs to service area.

### Phase 4 — Scheduling engine

1. Add estimated duration/crew size.
2. Add crew availability.
3. Add schedule board.
4. Add overbooking detection.
5. Add suggested slots.

### Phase 5 — Route optimizer

1. Use Google route matrix.
2. Optimize job ordering.
3. Show travel time.
4. Show daily route timeline.
5. Support multiple crews/routes per day.

## Strategic recommendation

Do not jump straight to full route optimization first. Build clean data first, then automate.

Recommended order:

```text
Service catalog → smarter request form → service area validation → job duration estimates → crew availability → schedule board → route optimization
```

## Current immediate implementation target

Begin with Phase 1, step 1: public homepage, services page, pricing page, and request form service preselection should read from admin-managed service records instead of hardcoded public service lists.
