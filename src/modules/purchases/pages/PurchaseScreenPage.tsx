import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { activeBranchId, canManageAllBranches, useAuthStore, useBranchChoice } from "@/shared/auth/authStore"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useAppSettings } from "@/modules/settings"
import { useBranchList } from "@/modules/branches/queries"
import { useWarehouses } from "@/modules/lookups/service"
import { InvoiceDiscount } from "@/modules/pos/grid/InvoiceDiscount"
import { PartyPicker } from "@/modules/pos/grid/PartyPicker"
import { useScanner } from "@/modules/pos/grid/useScanner"
import { PaymentScreen } from "@/modules/pos/payment/PaymentScreen"
import { useCurrentShift } from "@/modules/pos/queries"
import type { CartDiscount, PosPayment } from "@/modules/pos/types"
import { findByBarcode, rememberProduct, useProductSearch } from "@/modules/products/lookup"
import type { Product } from "@/modules/products/types"
import { SupplierDialog } from "@/modules/suppliers/components/SupplierDialog"
import { useSupplierList } from "@/modules/suppliers/queries"
import { useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { useNextPurchaseNumber, useSavePurchase } from "../queries"
import { buyTotals, newBuyKey, spreadDiscount, type BuyLine } from "../screen/lines"
import { PurchaseBar } from "../screen/PurchaseBar"
import { PurchaseLines } from "../screen/PurchaseLines"

/** The date and time the date field holds ("2026-10-31T14:05"): now, in the browser's own time. */
const nowLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) }
const noDiscount: CartDiscount = { kind: "value", value: 0 }
const label = "text-[10px] text-pos-purchase dark:text-muted-foreground"
const field = "text-[11px] border-pos-purchase bg-card text-pos-purchase dark:border-border dark:bg-background dark:text-foreground"

/**
 * The second purchases screen, laid out as in the current system: the top bar, a row of purchase details (branch, supplier
 * with a "+" for a new one, balance, warehouse, date, notes), the items table, then the totals with delete and pay.
 * Saving receives the goods into the warehouse.
 */
export default function PurchaseScreenPage() {
  const { t, i18n } = useTranslation()
  const settings = useAppSettings()
  const session = useAuthStore((s) => s.session)
  const qc = useQueryClient()
  const { data: units = [] } = useUnits()
  const { data: taxes = [] } = useTaxes()
  const { data: suppliers = [] } = useSupplierList()
  const { data: warehouses = [] } = useWarehouses()
  const { data: branches = [] } = useBranchList()
  const shift = useCurrentShift()
  const nextNumber = useNextPurchaseNumber()
  const save = useSavePurchase()
  // One key per purchase being written, so a double click or a retry after a dropped connection saves it once.
  const key = useRef(newIdempotencyKey())

  const [lines, setLines] = useState<BuyLine[]>([])
  const [supplierId, setSupplierId] = useState(0)
  const [warehouseId, setWarehouseId] = useState(0)
  const [date, setDate] = useState(nowLocal)
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState<CartDiscount>(noDiscount)
  const [tried, setTried] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [addingSupplier, setAddingSupplier] = useState(false)

  const exempt = settings.taxSetting?.taxSetting === "Exempt"
  const totals = useMemo(() => buyTotals(lines, discount), [lines, discount])
  const whole = useMemo(() => buyTotals(lines, noDiscount), [lines])
  const supplier = suppliers.find((s) => s.id === supplierId)
  // The first warehouse is used until the user picks another.
  const warehouse = warehouseId || warehouses[0]?.id || 0
  const canPickBranch = canManageAllBranches(session)
  const branch = activeBranchId() ?? session?.branchId ?? 0

  // The first supplier is chosen until the user picks another, as in the current system.
  useEffect(() => { if (!supplierId && suppliers.length) setSupplierId(suppliers[0].id) }, [suppliers, supplierId])

  // Direct items and raw materials are bought; prepared and branched items are not.
  const buyable = (p: Product) => p.isActive !== false && (p.productType === "Direct" || p.productType === "RawMatrial")
  // Names are searched on the server.
  const [typed, setTyped] = useState("")
  const found = useProductSearch(typed, { enabled: typed.trim() !== "", size: 50 })
  const results = useMemo(() => (typed.trim() === "" ? [] : (found.data ?? []).filter(buyable)), [typed, found.data])
  const search = useMemo(() => results.map((p) => ({ id: p.id, name: i18n.language === "en" && p.productNameEn ? p.productNameEn : p.productNameAr, code: p.barcode ?? "", price: p.costPrice ?? 0 })), [results, i18n.language])

  const toLine = (p: Product): BuyLine => ({
    key: newBuyKey(), barcode: p.barcode ?? "", productId: p.id, unitId: p.baseUnitId ?? 0, name: p.productNameAr, unitName: units.find((u) => u.id === p.baseUnitId)?.name ?? "",
    quantity: 1, unitPrice: p.costPrice ?? 0, taxId: p.taxId || undefined, taxRate: taxes.find((x) => x.id === p.taxId)?.amount ?? 0, taxCalculation: 2, discountKind: "value", discount: 0,
  })
  // Scanning an item already on the purchase raises its quantity instead of adding a second row.
  const add = (p: Product) => setLines((all) => {
    const same = all.find((l) => l.productId === p.id && l.unitId === p.baseUnitId)
    return same ? all.map((l) => (l.key === same.key ? { ...l, quantity: l.quantity + 1 } : l)) : [...all, toLine(p)]
  })
  const pick = (id: number) => { const p = results.find((x) => x.id === id); if (p) { rememberProduct(qc, p); add(p) } }
  const scan = async (code: string) => {
    const hit = await findByBarcode(qc, code.trim(), buyable)
    if (!hit || hit.unit) return false
    rememberProduct(qc, hit.product)
    add(hit.product)
    return true
  }
  useScanner((code) => { void scan(code) })

  const patch = (k: string, change: Partial<BuyLine>) => setLines((all) => all.map((l) => (l.key === k ? { ...l, ...change } : l)))
  const remove = (k: string) => setLines((all) => all.filter((l) => l.key !== k))
  const reset = () => { setLines([]); setDiscount(noDiscount); setNotes(""); setTried(false); key.current = newIdempotencyKey() }

  // A purchase belongs to a branch: switching it starts a new purchase and reloads what the branch owns.
  const pickBranch = (id: number) => {
    useBranchChoice.getState().select(session?.userId ?? null, id)
    reset(); setSupplierId(0); setWarehouseId(0)
    void qc.invalidateQueries()
  }

  const missingTax = !exempt && lines.some((l) => !l.taxId)
  const problem = lines.length === 0 ? "pos3.errors.noLines" : !supplierId ? "pos3.errors.noSupplier" : !warehouse ? "pos3.errors.noWarehouse" : missingTax ? "pos3.errors.noTax" : null

  const startPay = () => {
    setTried(true)
    if (problem) return void toast.error(t(problem))
    setPayOpen(true)
  }

  const confirm = (payments: PosPayment[]) => {
    save.mutate({
      key: key.current,
      data: {
        supplierId, warehouseId: warehouse, date, notes,
        lines: spreadDiscount(lines, discount).map(({ key: _k, barcode: _b, lineNote: _n, ...l }) => l),
        payments: payments.map((p) => ({ amount: p.amount, method: p.method, treasuryId: p.treasuryId, notes: "" })),
      },
    }, { onSuccess: () => { setPayOpen(false); reset(); setDate(nowLocal()) }, onError: renewIfReused(key) })
  }

  const afterDiscount = totals.grandTotal - totals.tax
  const discounted = discount.value > 0
  const clear = () => lines.length && setClearOpen(true)

  const deleteButton = (cls: string) => <button type="button" onClick={clear} className={cn("rounded-md bg-pos-purchase text-xs text-pos-purchase-foreground transition-all duration-200 hover:opacity-90 active:scale-95", cls)}>{t("common.delete")}</button>
  const payButton = (cls: string) => <button type="button" onClick={startPay} disabled={save.isPending} className={cn("rounded-md bg-brand-green font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60", cls)}>{t("pos3.pay")}</button>
  const row = "flex items-center justify-between px-3 py-2"
  const name = "font-bold text-muted-foreground"

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full shrink-0 rounded-sm border border-border text-sm">
          <div className="flex flex-col gap-3 px-4 py-3">
            <PurchaseBar invoiceNumber={nextNumber.data ?? "---"} shiftId={shift.data?.id} />
            <div className="h-px bg-border" />
            <div className={cn("grid grid-cols-1 items-end gap-3 sm:grid-cols-4", canPickBranch ? "lg:grid-cols-[180px_minmax(0,1fr)_150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]")}>
              {canPickBranch && (
                <div className="flex flex-col gap-1">
                  <span className={label}>{t("pos3.branch")}</span>
                  <Select value={branch ? String(branch) : ""} onValueChange={(v) => pickBranch(Number(v))}>
                    <SelectTrigger className={cn("w-full rounded-sm", field)} aria-label={t("pos3.branch")}><SelectValue placeholder={t("reports.pick")} /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex min-w-0 items-end gap-2">
                <Button type="button" size="icon-lg" variant="outline" aria-label={t("pos3.addSupplier")} className="border-pos-purchase bg-card text-pos-purchase dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-muted" onClick={() => setAddingSupplier(true)}><Plus size={14} /></Button>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={label}>{t("pos3.pickSupplier")}</span>
                  <PartyPicker plain parties={suppliers.map((x) => ({ id: x.id, name: x.supplierName, phone: x.phone ?? "" }))} value={supplierId} onPick={(s) => setSupplierId(s.id)} invalid={tried && !supplierId}
                    placeholder={t("pos3.pickSupplier")} searchPlaceholder={t("suppliers.search")} empty={t("pos3.noSupplier")} />
                </div>
              </div>
              {settings.customersTab?.showActualBalance && (
                <div className="flex flex-col gap-1">
                  <span className={label}>{t("pos3.supplierBalance")}</span>
                  <Input value={supplier ? formatMoney(supplier.balance ?? 0) : ""} readOnly className={cn("cursor-not-allowed text-center", field)} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className={label}>{t("sales.warehouse")}</span>
                <Select value={warehouse ? String(warehouse) : ""} onValueChange={(v) => setWarehouseId(Number(v))}>
                  <SelectTrigger className={cn("w-full rounded-sm", field, tried && !warehouse && "border-destructive")} aria-label={t("sales.warehouse")}><SelectValue placeholder={t("reports.pick")} /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.warehouseName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <label className="flex flex-col gap-1">
                <span className={label}>{t("pos3.invoiceDate")}</span>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value || nowLocal())} className={field} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={label}>{t("common.notes")}</span>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder={t("pos3.notePlaceholder")} className={cn("min-h-10 resize-none rounded-sm py-1", field)} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 p-4">
        <PurchaseLines lines={lines} taxes={taxes} exempt={exempt} editTotal={settings.purchasesScreenTab?.purchesSetting} showErrors={tried} search={search} onPick={pick} onCode={scan} onQuery={setTyped} searching={found.isFetching}
          codeOf={(l) => l.barcode || String(l.productId)} onChange={patch} onRemove={remove} />

        <div className="w-full shrink-0 border border-border text-[11px]">
          <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_260px]">
            <div className="flex flex-col border-e border-border">
              <div className={cn(row, "border-b border-border")}><span className={name}>{t("pos2.beforeDiscount")}</span><span className="font-medium">{formatMoney(totals.subTotal)}</span></div>
              <div className="border-b border-border px-3 py-2"><InvoiceDiscount discount={discount} onChange={setDiscount} fieldsAlways /></div>
              <div className={row}><span className={name}>{t("pos2.afterDiscount")}</span><span className="font-medium">{formatMoney(afterDiscount)}</span></div>
            </div>
            <div className="flex flex-col border-e border-border">
              {!exempt && <div className={cn(row, "border-b border-border")}><span className={name}>{t("pos2.totalBeforeTax")}</span><span className="font-medium">{formatMoney(afterDiscount)}</span></div>}
              {!exempt && (
                <div className={cn(row, "border-b border-border")}>
                  <span className={name}>{t("pos2.totalTax")}</span>
                  <div className="flex items-center gap-2">{discounted && <span className="text-[10px] text-faint line-through">{formatMoney(whole.tax)}</span>}<span className="font-medium">{formatMoney(totals.tax)}</span></div>
                </div>
              )}
              <div className={row}>
                <span className={name}>{t("pos2.grandTotal")}</span>
                <div className="flex items-center gap-2">
                  {discounted && <><span className="text-[10px] text-faint line-through">{formatMoney(whole.grandTotal)}</span>
                    <button type="button" aria-label={t("pos2.removeDiscount")} onClick={() => setDiscount(noDiscount)} className="flex size-4 items-center justify-center rounded-full bg-muted text-xs leading-none text-muted-foreground hover:bg-destructive-soft hover:text-destructive">×</button></>}
                  <span className="font-medium text-blue-700 dark:text-primary">{formatMoney(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="flex items-center justify-center border-e border-border p-2">{deleteButton("h-full w-full px-3 py-1")}</div>
              <div className="flex flex-col items-stretch justify-center gap-2 p-2">{payButton("flex-1 text-base")}</div>
            </div>
          </div>

          <div className="flex flex-col lg:hidden">
            <div className="grid grid-cols-1 gap-1 border-b border-border p-2">{deleteButton("py-1.5 text-[10px]")}</div>
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className={row}><span className="text-muted-foreground">{t("pos2.beforeDiscount")}</span><span className="font-medium">{formatMoney(totals.subTotal)}</span></div>
              <div className={row}><span className={name}>{t("pos2.afterDiscount")}</span><span className="font-medium">{formatMoney(afterDiscount)}</span></div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              {!exempt && <div className={row}><span className="text-muted-foreground">{t("pos2.tax")}</span><span className="font-medium">{formatMoney(totals.tax)}</span></div>}
              <div className={cn(row, exempt && "col-span-2")}><span className="text-muted-foreground">{t("pos2.grandTotal")}</span><span className="font-medium text-blue-700 dark:text-primary">{formatMoney(totals.grandTotal)}</span></div>
            </div>
            <div className="px-3 py-2"><InvoiceDiscount discount={discount} onChange={setDiscount} fieldsAlways /></div>
            <div className="border-t border-border p-2">{payButton("w-full py-2 text-sm")}</div>
          </div>
        </div>
        </div>
      </div>

      <SupplierDialog open={addingSupplier} onOpenChange={setAddingSupplier} onSaved={(saved) => {
        const made = (saved as { id?: number; data?: { id?: number } } | null | undefined)
        const id = made?.id ?? made?.data?.id
        if (id) setSupplierId(id)
      }} />
      <PaymentScreen purchase open={payOpen} onOpenChange={setPayOpen} total={totals.grandTotal} hasCustomer={!!supplierId} customerName={supplier?.supplierName ?? ""} pending={save.isPending} onConfirm={confirm} />
      <ConfirmDialog open={clearOpen} onOpenChange={setClearOpen} title={t("pos3.clearTitle")} description={t("pos3.clearBody")} confirmLabel={t("pos.clearCart")}
        onConfirm={() => { reset(); setClearOpen(false) }} />
    </div>
  )
}
