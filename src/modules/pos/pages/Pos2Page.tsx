import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useSaleDefaults } from "../components/Cart"
import { useAppSettings } from "@/modules/settings"
import { useCustomers, useEmployees, useWarehouses } from "@/modules/lookups/service"
import type { Shift } from "@/modules/shifts/types"
import { ShiftReportDialog } from "@/modules/shifts/components/ShiftReportDialog"
import { useCloseShift } from "@/modules/shifts/queries"
import { useUnits } from "@/modules/units/queries"
import { cartTotals } from "../cart"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { OpticsToolsDialog } from "../components/OpticsToolsDialog"
import { ShiftGate } from "../components/ShiftGate"
import { PaymentScreen } from "../payment/PaymentScreen"
import { usePosBeauty } from "../hooks"
import { useNextInvoiceNumber, useSaveSale } from "../queries"
import { useInvoiceOutput } from "@/modules/sales/print/useInvoiceOutput"
import { OrderRequestBanner, useOrderRequestMode } from "../orderRequestMode"
import { getCustomerCompanionId, usePosStore } from "../store"
import type { PosPayment } from "../types"
import { Pos2Header } from "../grid/Pos2Header"
import { InvoicesDialog } from "../grid/InvoicesDialog"
import { QuotationDialog } from "../grid/QuotationDialog"
import { SalesLines } from "../grid/SalesLines"
import { SalesSummary } from "../grid/SalesSummary"
import { useItemLookup } from "../grid/useItemLookup"
import { useScanner } from "../grid/useScanner"

/** The second sales screen: the sale is typed or scanned into a table instead of picked from a product grid. */
export default function Pos2Page({ optics = false }: { optics?: boolean }) {
  return <ShiftGate>{(shift) => <Pos2Screen shift={shift} optics={optics} />}</ShiftGate>
}

/** `optics` is the optical shop's screen: this one plus the customer tools (measurements and the rest), as in the current POS. */
function Pos2Screen({ shift, optics }: { shift: Shift; optics: boolean }) {
  const { t } = useTranslation()
  const appSettings = useAppSettings()
  const defaultCustomer = appSettings.customersTab?.defultCustomar
  const defaultEmployee = appSettings.salonsTab?.defaultServiceEmployeeId
  const showEmployee = appSettings.salonsTab?.showEmployeeService === true
  usePosBeauty()
  const { data: units = [] } = useUnits()
  const { data: warehouses = [] } = useWarehouses()
  const { data: customers = [] } = useCustomers()
  const { data: employees = [] } = useEmployees(showEmployee)
  const nextNumber = useNextInvoiceNumber()
  const save = useSaveSale()
  const order = useOrderRequestMode()
  const printInvoice = useInvoiceOutput()
  const closeShift = useCloseShift()
  const saleDefaults = useSaleDefaults()
  // The optics screen starts every sale with no customer: the cashier picks or adds one in the customer tools.
  // This screen has no order type: a table paid from the invoices list (dine-in checkout) leaves it selling as before.
  const defaults = () => {
    if (usePosStore.getState().orderType === "InDine") usePosStore.getState().setOrderType("TakeAway")
    return optics ? usePosStore.getState().setCustomer(null, "") : saleDefaults()
  }

  const [payOpen, setPayOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const measurement = usePosStore((s) => s.selectedMeasurement)
  const [report, setReport] = useState<Shift | null>(null)
  const [toClose, setToClose] = useState<Shift | null>(null)

  const lines = usePosStore((s) => s.lines)
  const lineProductIds = useMemo(() => lines.map((l) => l.productId), [lines])
  const lookup = useItemLookup(lineProductIds, appSettings.itemsTab?.enablePieceAndCartonSystem || appSettings.itemsTab?.showCoastPrice)
  const discount = usePosStore((s) => s.discount)
  const customerId = usePosStore((s) => s.customerId)
  const customerName = usePosStore((s) => s.customerName)
  const employeeId = usePosStore((s) => s.employeeId)
  const note = usePosStore((s) => s.note)
  const saveState = usePosStore((s) => s.save)
  const store = usePosStore.getState
  const locked = saveState !== "idle"
  const totals = useMemo(() => cartTotals(lines, discount), [lines, discount])
  const undiscounted = useMemo(() => cartTotals(lines, { kind: "value", value: 0 }), [lines])
  const exempt = appSettings.taxSetting?.taxSetting === "Exempt"

  // The branch's default customer (or the first customer) is filled in once, as in the current POS.
  const defaulted = useRef(false)
  useEffect(() => {
    if (defaulted.current || !customers.length) return
    defaulted.current = true
    if (optics) { if (store().lines.length === 0 && store().save === "idle") store().setCustomer(null, ""); return }
    const c = customers.find((x) => x.id === Number(defaultCustomer)) ?? customers[0]
    if (c && store().customerId == null && store().lines.length === 0 && !store().orderRequest) store().setCustomer(c.id, c.customerName)
  }, [customers, defaultCustomer, store, optics])

  // The default service employee is picked once, when the setting is on and nobody was chosen yet.
  const employeeDefaulted = useRef(false)
  useEffect(() => {
    if (employeeDefaulted.current || !showEmployee || !employees.length) return
    employeeDefaulted.current = true
    const e = employees.find((x) => x.id === Number(defaultEmployee))
    if (e && store().employeeId == null && store().lines.length === 0) store().setEmployee(e.id)
  }, [employees, defaultEmployee, showEmployee, store])

  const unitName = useCallback((id: number) => units.find((u) => u.id === id)?.name ?? "", [units])

  const pick = (id: number) => {
    const line = lookup.lineFor(id)
    if (line) store().add(line)
  }
  const scan = async (code: string) => {
    const line = await lookup.byCode(code)
    if (!line) return false
    store().add(line)
    return true
  }
  useScanner((code) => { void scan(code) })

  const sale = (holding: boolean, payments: PosPayment[]) => {
    const s = store()
    return {
      orderType: s.orderType, customerId: s.customerId, customerCompanionId: getCustomerCompanionId(), deliveryCompanyId: s.deliveryCompanyId, tableId: s.tableId, dineInMode: s.dineInMode, dineInOrderId: s.dineInOrderId, employeeId: s.employeeId, warehouseId: warehouses[0]?.id ?? 0,
      lines: s.lines, discount: s.discount, note: s.note, holding, holdingOrderId: s.holdingOrderId, payments,
    }
  }
  const noWarehouse = warehouses.length === 0
  const empty = lines.length === 0
  /** Holding or paying an empty invoice says why nothing happened. */
  const needLines = (go: () => void) => (empty ? toast.error(t("pos2.addItemsFirst")) : go())

  const confirmPay = (payments: PosPayment[], print: boolean, action?: "pdf") => {
    save.mutate({ sale: sale(false, payments) }, {
      onSuccess: (res) => {
        setPayOpen(false)
        defaults()
        // "Save and print" prints on the paper the sales screen's invoice type setting names (2 roll, 3 A5, else A4).
        const type = appSettings.salesScreenTab?.sales2InvoiceType
        const paper = type === 2 ? "roll" : type === 3 ? "a5" : "a4"
        if (action === "pdf" && res.data?.id) printInvoice.mutate({ invoice: { id: res.data?.id }, as: "pdf", paper })
        else if (print && res.data?.id) printInvoice.mutate({ invoice: { id: res.data?.id }, as: "print", paper })
      },
    })
  }

  const balance = customers.find((c) => c.id === customerId)?.balance

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-background text-foreground sm:rounded-xl sm:border sm:border-border">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto xl:overflow-hidden">
        <OrderRequestBanner />
        <Pos2Header invoiceNumber={nextNumber.data ?? "---"} shiftId={shift.id} locked={locked}
          customerId={customerId} customerName={customerName} onCustomer={(id, name) => store().setCustomer(id, name)} onAddCustomer={() => setAddingCustomer(true)}
          balance={appSettings.customersTab?.showActualBalance ? (balance != null ? String(balance) : "") : null}
          employees={showEmployee ? employees : null} employeeId={employeeId} onEmployee={(id) => store().setEmployee(id)}
          note={note} onNote={(n) => store().setNote(n)} onShift={() => setReport(shift)}
          optics={optics} onTools={() => setToolsOpen(true)} measurement={measurement?.name ?? null} />

        <div className="flex flex-col space-y-3 px-2 pt-0 pb-24 sm:px-3 sm:pt-0 sm:pb-24 xl:min-h-0 xl:flex-1 xl:space-y-5 xl:overflow-hidden xl:px-4 xl:pt-0 xl:pb-0">
          <SalesLines lines={lines} search={lookup.options} onQuery={lookup.onQuery} searching={lookup.searching} onPick={pick} onCode={scan} product={lookup.productOf} unitName={unitName} locked={locked}
            options={{ exempt, editPrice: appSettings.itemsTab?.allowPriceChangeOnSale, showCost: appSettings.itemsTab?.showCoastPrice, saleUnits: appSettings.itemsTab?.enablePieceAndCartonSystem }} />

          <SalesSummary totals={totals} undiscounted={undiscounted} discount={discount} onDiscount={(d) => store().setDiscount(d)} exempt={exempt}
            locked={locked} uncertain={saveState === "uncertain"} busy={save.isPending || order.saving || (noWarehouse && !order.mode)} orderMode={!!order.mode}
            onQuotation={() => setQuoteOpen(true)}
            onHold={() => store().dineInMode ? toast.error(t("posTables.cannotHold")) : needLines(() => save.mutate({ sale: sale(true, []) }, { onSuccess: () => defaults() }))}
            onClear={() => { if (locked) return; if (order.mode) store().startOrderRequest({ mode: order.mode, customerId: store().customerId, customerName: store().customerName }); else { store().clear(); defaults() } }}
            onHeld={() => setHeldOpen(true)} onDiscarded={defaults}
            onPay={() => needLines(() => (order.mode ? order.save() : setPayOpen(true)))} optics={optics} />
        </div>
      </div>

      <PaymentScreen open={payOpen} onOpenChange={setPayOpen} total={totals.grandTotal} hasCustomer={customerId != null} customerName={customerName} showCustomer={false} pending={save.isPending} onConfirm={confirmPay} />
      <InvoicesDialog open={heldOpen} onOpenChange={setHeldOpen} />
      <QuotationDialog open={quoteOpen} onOpenChange={setQuoteOpen} />
      {optics && <OpticsToolsDialog open={toolsOpen} onOpenChange={setToolsOpen} />}
      <CustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onCreated={(id, name) => store().setCustomer(id, name)} />
      <ShiftReportDialog shift={report} onOpenChange={(o) => !o && setReport(null)} onClose={setToClose} />
      <ConfirmDialog open={!!toClose} onOpenChange={(o) => !o && setToClose(null)} pending={closeShift.isPending}
        title={t("shifts.closeTitle")} description={t("shifts.closeBody", { id: toClose?.id })} confirmLabel={t("shifts.close")}
        onConfirm={() => toClose && closeShift.mutate(toClose.id, { onSuccess: () => { setToClose(null); setReport(null) } })} />
    </div>
  )
}
