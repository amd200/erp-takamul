import { useMemo, useState } from "react"
import { CreditCard, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { errorToast } from "@/shared/api/errors"
import { useTables } from "@/modules/tables/queries"
import type { DiningTable } from "@/modules/tables/types"
import { dineInLineOf } from "../cart"
import { posApi } from "../service"
import { usePosStore } from "../store"
import type { DineInMode } from "../types"

type Filter = "all" | DiningTable["status"]

const STATUS_COLOR: Record<DiningTable["status"], string> = { Free: "bg-green-500", Occupied: "bg-red-500" }

/** A table drawn from above with its four sides' chairs; the bar under it shows whether it is free. */
function TableCard({ table, selected, onClick }: { table: DiningTable; selected: boolean; onClick: () => void }) {
  const chair = (cx: number, cy: number, arcs: string[]) => (
    <>
      <circle cx={cx} cy={cy} r="14" style={{ fill: "var(--card)", stroke: "var(--text-main)" }} strokeWidth="1.5" />
      {arcs.map((d, i) => <path key={i} d={d} fill="none" style={{ stroke: "var(--text-main)" }} strokeWidth={1.5 - i * 0.2} opacity={1 - i * 0.3} />)}
    </>
  )
  return (
    <div onClick={onClick} className={`flex h-[200px] cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition-all ${selected ? "border-2 border-primary" : "border-border hover:border-primary/30"}`}>
      <div className="flex min-h-0 flex-1 items-center justify-center p-2">
        <svg viewBox="0 0 260 210" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" style={{ overflow: "visible" }}>
          <rect x="65" y="58" width="130" height="90" rx="12" style={{ fill: "var(--card)", stroke: "var(--border)" }} strokeWidth="1.5" />
          <text x="130" y="99" textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: "var(--text-main)" }}>{table.tableName}</text>
          {table.currentOrderId && <text x="130" y="115" textAnchor="middle" fontSize="9" style={{ fill: "var(--text-muted)" }}>{table.currentOrderId}</text>}
          {chair(95, 38, ["M83 25 Q95 16 107 25", "M80 21 Q95 10 110 21", "M77 17 Q95 4 113 17"])}
          {chair(165, 38, ["M153 25 Q165 16 177 25", "M150 21 Q165 10 180 21", "M147 17 Q165 4 183 17"])}
          {chair(95, 168, ["M83 181 Q95 190 107 181", "M80 185 Q95 196 110 185", "M77 189 Q95 202 113 189"])}
          {chair(165, 168, ["M153 181 Q165 190 177 181", "M150 185 Q165 196 180 185", "M147 189 Q165 202 183 189"])}
          {chair(34, 103, ["M20 91 Q11 103 20 115", "M16 87 Q6 103 16 119", "M12 83 Q1 103 12 123"])}
          {chair(226, 103, ["M240 91 Q249 103 240 115", "M244 87 Q254 103 244 119", "M248 83 Q259 103 248 123"])}
        </svg>
      </div>
      <div className={`h-1.5 shrink-0 ${STATUS_COLOR[table.status]}`} />
    </div>
  )
}

/**
 * The tables screen of the current POS: a filter (all / free / busy), a card per table, and under them what the
 * selected table allows: a free one starts a new order; a busy one takes more items or goes to payment.
 * Both load the table's open order into the cart (`onOpened` then brings the cart back).
 */
export function TablesScreen({ onOpened }: { onOpened: () => void }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const { data: tables = [] } = useTables()
  const shown = useMemo(() => tables.filter((x) => filter === "all" || x.status === filter), [tables, filter])
  const selected = tables.find((x) => x.id === selectedId)

  const start = (table: DiningTable, mode: DineInMode) => {
    if (usePosStore.getState().save !== "idle") return toast.error(t("pos.lockedHint"))
    if (mode === "new-order") {
      if (usePosStore.getState().startDineIn({ mode, tableId: table.id, orderId: null })) onOpened()
      return
    }
    setBusy(true)
    posApi.dineIn.byTable(table.id)
      .then((order) => {
        const lines = (order.items ?? []).map(dineInLineOf)
        const ok = usePosStore.getState().startDineIn({ mode, tableId: table.id, orderId: order.id, orderNumber: order.orderNumber, lines, customerId: order.customerId || null, customerName: order.customerName ?? "", note: order.notes ?? "", orderDeviceNumber: order.orderDeviceNumber ? String(order.orderDeviceNumber) : null, employeeId: order.employeeId })
        if (ok) onOpened()
      })
      .catch((e) => errorToast(e, "common.loadFailed"))
      .finally(() => setBusy(false))
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 border-b border-border bg-background p-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="gap-2 bg-transparent p-0">
            {(["all", "Free", "Occupied"] as const).map((v) => (
              <TabsTrigger key={v} value={v} className="rounded-lg border border-transparent text-xs text-muted-foreground data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none!">
                {v === "all" ? t("posTables.all") : v === "Free" ? t("posTables.free") : t("posTables.occupied")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-4 overflow-y-auto px-4 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.length === 0
          ? <div className="col-span-full flex items-center justify-center py-12 text-sm text-muted-foreground">{t("posTables.none")}</div>
          : shown.map((x) => <TableCard key={x.id} table={x} selected={selectedId === x.id} onClick={() => setSelectedId(selectedId === x.id ? null : x.id)} />)}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          {([["bg-green-500", t("posTables.free")], ["bg-red-500", t("posTables.occupied")]] as const).map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className={`size-3 rounded-full ${c}`} />{l}</div>
          ))}
        </div>

        {selected && (
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-black text-foreground">{selected.tableName}</div>
              <div className="text-xs text-muted-foreground">{selected.currentOrderId ? `${t("posTables.orderHash")}${selected.currentOrderId}` : t("posTables.free")}</div>
            </div>
            {selected.status === "Occupied" ? (
              <>
                <Button type="button" size="xl" variant="outline" disabled={busy} onClick={() => start(selected, "add-items")}><Plus size={14} /> {t("posTables.addProducts")}</Button>
                <Button type="button" size="xl" disabled={busy} onClick={() => start(selected, "checkout")}><CreditCard size={14} /> {t("posTables.proceedToPayment")}</Button>
              </>
            ) : (
              <Button type="button" size="xl" onClick={() => start(selected, "new-order")}>{t("posTables.selectAndPlaceOrder")}</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
