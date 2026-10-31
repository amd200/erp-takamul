# تكامل البيانات (واجهة جديدة)

Redesign of the Takamul ERP front end. Design-only for now: every module reads from an in-memory mock store with the real API's shapes, so wiring the backend later only touches each module's `service.ts`.

```
npm install
npm run dev
```

Sign-in uses the real server (`https://finaltest.takamulb.online/api/`). In dev the browser calls `/api` and Vite forwards it, so the refresh-token cookie stays first-party and no CORS setup is needed. Change the target in `.env.development`; production reads `.env.production`.

Only auth is wired to the server so far; every other module still reads its in-memory mock until its `service.ts` is switched over.

## Stack

React 19, Vite, TypeScript, Tailwind 4, shadcn/ui (radix-nova, `rtl: true`), React Router (lazy routes), TanStack Query, react-hook-form + zod, i18next (ar / en).

## Layout

```
src/
  app/                 App providers, router, layout (Sidebar, Topbar, nav tree)
  components/ui/       shadcn components (added with `npx shadcn add`; edit in place when needed)
  components/          Built on shadcn: DataTable, PageHeader, SectionCard, EmptyState,
                       ConfirmDialog, RowActions, ImportPanel, form/FormFields
  shared/
    api/               mockStore (in-memory tables) and createCrudQueries
    i18n/              ar.json, en.json; switching language flips dir
    permissions/       permission keys, useCan, <Can>, <RequirePermission>
    session/           signed-in user, branch and permissions
    theme/             light / dark / system
  modules/<name>/
    types.ts           API shapes
    service.ts             endpoints (mock today)
    queries.ts         TanStack Query hooks
    schema.ts          zod schemas; messages are i18n keys
    components/        module-only pieces
    pages/             one file per route, default export
    routes.tsx         lazy routes guarded by permissions
```

## Rules

- No hard-coded UI text: add keys to both `ar.json` and `en.json`.
- Colors come from tokens in `index.css` (logo palette). Use `success`, `warning`, `destructive` for state, never raw colors.
- Logical spacing only (`ms-`, `pe-`, `start-`), so RTL and LTR both work.
- Lists use `DataTable`; forms use `FormFields` + a zod schema; deletes go through `ConfirmDialog`.
- A new section = a new folder in `modules/`, its routes added in `app/router.tsx`, its menu entries in `app/layout/nav.ts`.

## Settings module boundary

- Import settings hooks and types from `@/modules/settings`: `useSettings`, `useAppSettings`, `TaxSetting`, and `AppSettings`.
- `shared/session/session.ts` only owns the signed-in user, branch and permissions.
- Inside the settings module, use relative imports. Route composition uses the dedicated `settings/routes` entry point from `app/router.tsx`.
