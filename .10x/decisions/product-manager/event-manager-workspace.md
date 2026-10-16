# Event manager workspace — product decision

**Target user:** the event manager (MANAGER tier, e.g. Senthil Kumar; executives for their own events).
**Core job:** get every upcoming event show-ready, run it on the day, and close it out.
**Problem:** answering "is this event ready, and what is blocking it?" takes five back-office screens (Job orders, Inventory, Finance, Vendors, Calendar), none of which is organized by event.

## Scope (chosen: full lifecycle)
P0
- "My events" home: one card per event with four readiness checks (job orders, gear, client payments, vendors & permits), each green / amber / red with a one-line reason and a countdown to load-in.
- "Needs you" list: blockers across all events, ranked by severity then days to show, each with an owner and a one-click fix.
- Event workspace page per event: lifecycle timeline, readiness strip, tabs for Job orders, Gear, Money, Vendors & permits, Run of show, Wrap-up.
- Vendor bookings and permits tracked per event (new data).
P1
- Show-day mode (phone-first): now/next run-of-show item, tick-offs, crew on duty, report an issue.
- Alerts bell: red blockers and shows within 3 days with open items; mark as read.
- Wrap-up: derived close-out checklist (jobs done, gear back, final invoice raised and paid, vendors settled) plus client feedback; Close event.
- Gear shortfall: keep the requested quantity, show the gap, retry reservation when stock frees up.
P2
- Plain-language copy throughout; back-office modules move to a secondary "Back office" menu.

## Readiness rules
- Job orders: red if any order is overdue or past due; amber if one is waiting for QC, due within 3 days and incomplete, or none exist.
- Gear: red if any requested quantity could not be reserved; amber if nothing is reserved.
- Client payments: red if any invoice is overdue, or the fabrication advance is unpaid within 7 days of load-in; amber if the retainer isn't invoiced or invoices are awaiting payment.
- Vendors & permits: red if a booking is past its due date and unconfirmed; amber if any is unconfirmed or nothing is booked.

## Success criteria
- From the home screen a manager can tell whether a given event is ready in under 10 seconds, without opening another screen.
- Every red check names an owner and reaches its fix in at most 2 clicks.
- Target: 100% of events reach load-in with all four checks green.
- Show-day tasks can be ticked one-handed at 390 px width.

## Not building
Backend persistence, push/email notifications, client portal, crew rostering and timesheets, Gantt charts.

## Risks
- Readiness rules may not match the team's real definition of ready; they are kept in one pure module (`src/domain/readiness.ts`) so they're easy to tune.
- Vendor and permit status is entered by hand, so it is only as good as its upkeep; past-due items turn red to force attention.
