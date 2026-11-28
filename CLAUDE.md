# erpv2-classic – notes for Claude

The new, organised ERP front end (React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query/Table) that must look and behave
**exactly like the current system** `E:\web\takamul2` (React + Vite, PrimeReact tables). Back end (read-only reference):
`E:\web\ERP-server-new\ERP` (ASP.NET Core: `ERP.BLL/DTOs`, `ERP.PL/Controllers`, `ERP.DAL`). `E:\web\erpv2` is the
older structured sibling this project was built on. No commits exist yet in this repo (`git log` is empty, some files were
staged by hand earlier).

## Working rules (from the user)
- Reply in Egyptian Arabic, short and frank. Say what was verified and what was not.
- Never commit or push until the user says so; then straight to `main`, no PR.
- Same look, texts, order, columns and buttons as the old system. Anything the old system does not have is removed. If the
  old system has something the back end has no endpoint for, say so; do not invent it.
- Use back-end data as it comes (field names as the server sends them). No mappers / `fromDto`. A small `...FormOf` helper that
  turns a record into form strings is fine. If a field is not returned, say so instead of computing it.
- Check the back end (DTO / enum / controller) before claiming anything about it. The user asks "مين قالك".
- Tables go through the shared `DataTable` (TanStack Table v9). `size="xl"` on a button here is `h-12` (old `xl` was `h-10`).
- After every change `npx tsc -b` must pass, then open the page in the browser and check it. Report what could not be tried.
- Add translation keys with a JSON round-trip (`json.dumps(d, ensure_ascii=False, indent=2) + "\n"` reproduces the files
  byte for byte), as a new block; old-system texts come from `takamul2/src/locales` and from `t("key", "default")` in its code.
- Read a file before editing it. Long scripts: write a `.py`/`.cjs` file; bash heredocs with many quotes fail.

## Testing without a back end
- There is none locally. Start `VITE_API_BASE_URL=http://localhost:5198/api npx vite --port 5180` and a throw-away Node mock on
  5198 that answers `/api/Auth/refresh-token` with an unsigned JWT (claims `UserId`, `username`, `BranchId`,
  `IsMultiBranch`, role claim `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` = `SuperAdmin`), `/Settings` with
  `{}`, and the page's own data in the server's shapes. Open with `preview_start {url}` then `navigate`.
- Port 5199 belongs to another service on this machine; do not stop it. Stop only the vite/mock you started.
- The browser pane's test environment fails any request whose URL is 140+ characters (ERR_FAILED); drop a param to try, put it back.
- Resize with `resize_window` (e.g. 1536x700, `colorScheme: "light"`) and reset to `desktop` afterwards.

## Structure
- `src/modules/<name>/` per feature (`types.ts`, `service.ts`, `queries.ts`, `schema.ts`, `pages/`, `components/`). Shared:
  `components/DataTable.tsx`, `shared/http` (`http()` throws `ApiError`, `fetchAllPages`), `shared/api/crudQueries.ts`,
  `shared/print/` (print + PDF from one HTML template), `shared/permissions`, `shared/auth` (session, `permissionMap.ts`).
- Settings: `modules/settings/types.ts` is GET /Settings as the server sends it (17 tab objects such as `generalTab`, plus a few older groups). `schema.ts` has one static `z.object` + defaults per page tab, keyed by the server's own group and field names (`generalTab.rowsPerPage`); `components/{SalesTabs,SiteTabs}.tsx` hold each tab's fields, `TabForm` is the one generic form, `service.ts` saves changed groups with `PUT /Settings/tabs/<tab>` (whole group, fresh read first). No mapping or renaming anywhere: readers use `useAppSettings().<tab>?.<field>` and compare enum names raw (`=== "Pos2"`). The local backend copy is outdated for this API; the user's backend report is the source.
- Permissions: the app checks coarse keys (`P.products.view`); `shared/auth/permissionMap.ts` lists the Arabic back-end strings
  that grant each. The role editor is separate (see Roles below) and works on the exact back-end strings.

## What was done (this round of work)

### Reports (sales) – `modules/reports/old/`
`ReportShell` (box + print / PDF / Excel), `SummaryCards`, `FiscalFilters` + `useFiscalFilters` (typed values vs `applied`
values; nothing loads before the first search), `ReportTable`, `output.ts` (print via `shared/print`, PDF, CSV as "Excel"),
`api.ts` (raw `GET /reports/products/*`). Pages: net sales, by invoice, by day, item sales, products sales, sales returns,
employee sales, category cards. Routes are fixed and win over `reports/:id`. Print/PDF margin is `body{padding:8mm}` (PDF is
captured from the body; `@page` does not apply). Server-paged reports (returns, employee, net sales) export every page
(200 rows per request, at most 50 requests); the other four endpoints return all rows and are paged on screen.
Still on the generic engine: items, purchases, customers, suppliers, expenses, profits reports and the shifts report.

### Settings – `modules/settings/`
- Operations tab: 7 missing switches added (print A4/roll, view payments, edit notes, sales return, PDF A4/roll download).
- About 50 Arabic labels corrected to the old system's text; site tabs renamed as in the old one.
- Look: `/settings/sales` = breadcrumb + card + tabs across the top + two-column fields (switches are تمكين/تعطيل selects, red `*`)
  + cancel/save footer. `/settings/system` = card "إعدادات الموقع" + side menu + titled boxes with their own save button.
  Both through `legacy` modes of `SectionForm` / `SettingField` (`"sales"` | `"site"`).
- Removed from the site menu: "money" (not in the old system; its definitions still exist, values stay local defaults).
- Loyalty tab (`components/LoyaltyTab.tsx`, own form, not `TabForm`): `GET|PUT /LoyaltyPoints` (404 = no record → server
  defaults) + switch `enableLoyaltyPoints` (top level of GET /Settings, `PUT /Settings/loyalty-points`). Assumed, report
  silent: camelCase, `calculationScope` by name, `workingDays` sent as DayOfWeek numbers (0 = Sunday), read as numbers or
  names. Only tried on a mock.
- Not done: reset-to-defaults button, customer display (COM / QZ hardware), the small
  headed sub-sections inside the sales tabs, tables / pricing / category-discount tabs restyled, `itemTax` switch still shown.

### Purchases screen 2 (`/pos3`) – `modules/purchases/{pages/PurchaseScreenPage,screen/*}`
Matches the old `AppLayout3` / `Topbar3` / `CartPanel3`: top bar (`PurchaseBar`: fullscreen, language, theme unless
`beautyTheme`, next invoice number from `useNextPurchaseNumber`, shift id, date-time, home), details row (branch picker for
multi-branch users, supplier + "+" add, balance, warehouse, date-time, notes), burgundy table with a per-line note (UI only;
the server has no field), footer with discount + delete / pay. Date-time is sent as chosen (`stamp()` in `purchases/service.ts`
keeps a full date-time). `--pos-purchase` (#871d46) lives in `index.css`. Differences kept on purpose: clear asks to confirm,
light/dark theme toggle only, next number shows `---` when there is no purchase yet (old showed a wrong `SO-D1-000001`).

### Real API instead of the in-memory mock
- **Employees** `modules/employees/`: `GET /employees` (paged, raw `firstName/mobile/branchName/userName`),
  `POST /employees/CreateEmployee`, `PUT|DELETE /employees/{id}`. Form: name, mobile, branch (only users who can manage branches).
- **Branch lookup**: `lookups.useBranches` now reads the real `/Branch` list (was a mock with 3 fake branches).
- **POS devices + certificates** `modules/pos-devices/`: `/pos-devices` (create sends the branch as `X-Branch-Id`),
  `/pos-devices/generate-serial`, ZATCA steps on **`/zatca-integration/*`** (`generate-csr {deviceId}` → `certificateId`,
  `register-ccsid {certificateId, otp}`, `upgrade-to-pcsid {certificateId}`), certificates `/certificates/all-certificates/summary`
  (one row per certificate; 404 = none), `DELETE /certificates/{id}`, history `/certificates/device/{id}/history` to resume.
  Answers come inside `{ success, message, data }`. Device status: NotRegistered, PendingOTP, CCSIDRegistered, PCSIDRegistered,
  Active, Expired, Revoked. The wizard saves `allowOnlineInvoicing: true` like the old one (the server does not return it).
- **Roles** `modules/roles/`: `catalog.ts` is the old system's permission tree as data (18 sections, 191 permissions, exact
  Arabic strings, labels under `rolePerms.*`); `tree.ts` is pure helpers; `PermissionTree` renders it. List
  `GET /permissions/AllRoles`, one role `GET /role-permissions/{roleId}`, create `POST /permissions/upsert`, update
  `POST /role-permissions/update`, delete `DELETE /permissions/RemoveRole/{name}`. Role ids are text; a name cannot change.
  Saving keeps any string the tree does not list (such as `<group>.الكل`) and renews the signed-in user's token afterwards.
  `المنتجات.حذف` appears under four item types in the tree but is one permission.
- Sidebar: devices, certificates (not when tax is "Exempt") and employees are back in `app/layout/nav.ts` under "المستخدمين".

### Customer ordering screen `/pos4` (built by a separate session)
Public (outside `RequireAuth`), `modules/pos/pages/Pos4Page.tsx` + `modules/pos/pos4/*`, route `pos4Routes`. No shift, no
permissions, no payment: a take-away order sent held (`isHolding:true`) with `TableNumber` and `posDeviceName` to
`POST /sales-orders/pos/takeaway`; reads `GET /Branch/public-info`, `/Settings`, `/Products`, `/Products/branched/{id}`,
`/ProductCategories/MainCategory`, `/Additions` without a token. `customerId` and `warehouseId` are fixed to 1 as in the old
screen. Missing: preparation-ticket printing (QZ), the tables page, category discount on the cart, Urdu.

## Not yet done (compared with the old system)
Gift cards, deliveries, sales/purchases/quantity-adjustment imports and quantity-adjustment edit, revenues, customer groups,
user groups (`/settings/groups`), local sync, tax / simplified invoice pages (unchecked against `sales/invoices/create`),
the remaining reports, the dashboard cards, an erpv2-style theme (idea parked: colours only or full look?).

## Not verified
Saving against a real server for most forms (return with two payments, debit note, quantity adjustment, suppliers, expenses,
reservations); the device wizard steps and employee add/edit were not run (lists were); real printing, PDF and CSV export of the
reports; the pos4 and purchases-2 screens with real products and suppliers; `npm audit` warnings; the sidebar change was only type-checked.
