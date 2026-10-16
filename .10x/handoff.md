# Handoff

## Current handoff
To Architect / SDE: event manager workspace is built per `.10x/decisions/product-manager/event-manager-workspace.md`. Readiness rules live in `src/domain/readiness.ts` (pure, tested in `readiness.test.ts`). New data: `bookings`, `runOfShow`, `issues`, `JobOrder.requested`, `ProductionEvent.feedback/closedAt`. Next: validate the four readiness rules with 2–3 event managers, then back these collections with an API.

## History
- (senior-engineer)
To SDE / backend: replace `createSeed()` (src/domain/seed.ts) with API loaders; keep store actions as the mutation boundary and keep RBAC checks server-side mirroring `src/domain/rbac.ts`. See `.10x/decisions/senior-engineer/event-management-system.md`.

