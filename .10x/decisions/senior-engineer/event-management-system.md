# Event Management System — senior engineering decisions

- Rebuilt the single-file canvas prototype as a Vite + React 18 + strict TS + Tailwind 3 app.
- Layering: domain (pure) → store (Zustand, RBAC-enforced actions returning ActionResult) → UI primitives → feature modules.
- RBAC: `src/domain/rbac.ts` permission matrix by minimum rank; `GatedButton` shows locked controls with required role; store re-checks.
- Expense approval is amount-dependent (`canDecideExpense`): > ₹5,00,000 → MD_CEO only.
- Gear reservation (`reserveGear`) clamps to availability and reports shortfall; completed job orders release gear.
- Detail dialogs (event, job) addressed by URL search params for deep links + command menu.
- Routes lazy-loaded; manual vendor chunking removed (broke React init order).
- Tests: Vitest on format, selectors, RBAC and store actions (28 tests).
- Known gaps: no backend/persistence (state resets on reload); assignee dropdowns are fixed lists; PDF export uses window.print.
