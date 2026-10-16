# Event Management System

Enterprise operations console for corporate summits, trade exhibitions, product launches and luxury galas across South India. React 18 · TypeScript (strict) · Tailwind CSS · Vite.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest — domain, RBAC and store behaviour
npm run typecheck
npm run build
```

## Architecture

```
src/
  domain/        Pure, framework-free business logic
    types.ts       Typed domain model (events, leads, inventory, job orders, vendors, payroll, AR/AP, expenses)
    rbac.ts        Single permission matrix: can(role, permission) — used by UI gating AND store enforcement
    selectors.ts   Derivations: receivables & aging, gear allocation/reservation, payroll net, budgets, P&L
    seed.ts        Demo dataset (swap for API responses)
  store/         Zustand store; every mutation re-checks RBAC and returns an ActionResult
  lib/           formatINR (en-IN Intl), dates, cn()
  components/
    ui/            Design-system primitives: Button, Field/Input/Select, Dialog, DataTable, Stat, Status, Segmented, Tooltip
    layout/        AppShell, 3-zone TopBar, Sidebar with role switcher, ⌘K command menu
    shared/        GatedButton (permission-aware), pickers, page header
  features/      One folder per module, lazy-loaded per route
```

### Principles

- **One source of truth for permissions.** `PERMISSIONS` maps capability → minimum role rank. Buttons the role can't use stay visible but locked with a tooltip naming the required role; the store refuses the action regardless of UI.
- **Derived, never duplicated.** Collected amounts, allocated stock, job progress and bank balance are computed from records, so marking an invoice Paid or completing a job order ripples everywhere.
- **Design tokens.** All colour lives in HSL CSS variables (`src/styles/index.css`) with light and dark themes; components only use semantic Tailwind names (`bg-surface`, `text-fg-muted`, `text-danger`).
- **Zero-pill discipline.** Status/priority render as dot + text (`<Status>`, `<Priority>`); filled capsules are reserved for controls.
- **Tabular figures** globally; currency always through `formatINR` (`₹48,00,000`).
- **Deep-linkable detail views.** `?event=EV-2026-CHE01` and `?job=JO-2026-CHE01-A` open detail dialogs from any module.

### Demo clock

`TODAY` in `src/lib/dates.ts` is fixed at 16 Oct 2026 so seeded statuses (live summit, overdue invoices) stay coherent. Replace with the real date when wired to a backend.
