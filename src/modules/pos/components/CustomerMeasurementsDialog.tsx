import { useEffect, useState } from "react"
import { eyeText } from "@/modules/customers/eye"
import { Eye } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmbeddedDialog } from "@/components/EmbeddedDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCustomers } from "@/modules/lookups/service"
import { useCustomer } from "@/modules/customers/queries"
import { EYE_FIELDS, type Measurement, type SelectedMeasurement } from "@/modules/customers/types"
import { cn } from "@/lib/utils"
import { PartyPicker } from "../grid/PartyPicker"
import { usePosStore } from "../store"

const LABELS: Record<(typeof EYE_FIELDS)[number], string> = { sphRight: "SPH R", sphLeft: "SPH L", cylRight: "CYL R", cylLeft: "CYL L", axisRight: "AXIS R", axisLeft: "AXIS L", add: "ADD", ipd: "IPD", clRight: "C.L", clLeft: "" }
/** Both contact lens values share one column, right | left, as in the current POS. */
const SHOWN = EYE_FIELDS.filter((k) => k !== "clLeft")

type Row = { key: string; source: SelectedMeasurement["source"]; companionId?: number; name: string; phone: string; fileNumber?: string; data: Measurement }

const hasValues = (m: Measurement) => EYE_FIELDS.some((k) => m[k] !== "")
const same = (sel: SelectedMeasurement | null, customerId: number, r: Row) =>
  !!sel && sel.customerId === customerId && sel.source === r.source && (sel.companionId ?? null) === (r.companionId ?? null)

/** Shows a customer's measurements and their companions' so the cashier can pick whose go on this invoice. */
export function CustomerMeasurementsDialog({ open, onOpenChange, customerId, embedded = false }: { open: boolean; onOpenChange: (o: boolean) => void; customerId: number | null
  /** Shown inside the optics customer-tools window instead of as its own popup. */
  embedded?: boolean }) {
  const { t } = useTranslation()
  const { data: customers = [] } = useCustomers()
  const selected = usePosStore((s) => s.selectedMeasurement)
  // Starts on the sale's customer; searching here only changes what this dialog shows.
  const [viewedId, setViewedId] = useState<number | null>(null)
  useEffect(() => { if (open) setViewedId(customerId) }, [open, customerId])
  const { data: customer, isLoading } = useCustomer(open && viewedId ? viewedId : undefined)

  const rows: Row[] = customer ? [
    { key: "customer", source: "customer", name: customer.customerName, phone: customer.phone ?? "", fileNumber: customer.fileNumber ?? "", data: eyeText(customer) },
    ...(customer.companions ?? []).map((c, i): Row => ({ key: `companion-${c.id ?? i}`, source: "companion", companionId: c.id, name: c.name ?? "", phone: c.phone ?? "", data: eyeText(c) })),
  ] : []

  const toggle = (row: Row) => {
    if (!customer) return
    const store = usePosStore.getState()
    if (same(selected, customer.id, row)) return store.setMeasurement(null)
    if (customer.id !== store.customerId) store.setCustomer(customer.id, customer.customerName)
    store.setMeasurement({ customerId: customer.id, source: row.source, companionId: row.companionId, name: row.name, ...Object.fromEntries(EYE_FIELDS.map((k) => [k, row.data[k]])) as Measurement })
    onOpenChange(false)
  }

  const body = (
    <>
        <DialogHeader className={cn(embedded && "sr-only")}><DialogTitle className="flex items-center gap-2"><Eye className="size-5" />{t("pos.measurements.title")}</DialogTitle></DialogHeader>
        <PartyPicker parties={customers.map((c) => ({ id: c.id, name: c.customerName, phone: c.phone ?? "" }))} value={viewedId ?? 0} onPick={(p) => setViewedId(p.id)}
          placeholder={t("pos.measurements.searchCustomer")} searchPlaceholder={t("customers.search")} empty={t("pos.noCustomer")} />

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          {!viewedId ? null : isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p> : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("pos.measurements.owner")}</TableHead>
                  {SHOWN.map((k) => <TableHead key={k} className="text-center">{LABELS[k]}</TableHead>)}
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const on = !!customer && same(selected, customer.id, r)
                  return (
                    <TableRow key={r.key} className={cn(on && "bg-secondary/40")}>
                      <TableCell>
                        <div className="text-sm font-semibold">{r.name}{r.source === "companion" && <span className="ms-1.5 text-xs font-normal text-muted-foreground">({t("customers.companion")})</span>}</div>
                        {(r.phone || r.fileNumber) && <div dir="ltr" className="text-start text-xs text-muted-foreground">{[r.phone, r.fileNumber && `#${r.fileNumber}`].filter(Boolean).join("  ·  ")}</div>}
                      </TableCell>
                      {SHOWN.map((k) => k === "clRight"
                        ? <TableCell key={k} dir="ltr" className="text-center tabular-nums"><span className="inline-flex overflow-hidden rounded border text-xs"><span className="border-e px-2 py-1">{r.data.clRight || "—"}</span><span className="px-2 py-1">{r.data.clLeft || "—"}</span></span></TableCell>
                        : <TableCell key={k} dir="ltr" className="text-center tabular-nums">{r.data[k] || <span className="text-faint">—</span>}</TableCell>)}
                      <TableCell>
                        <Button type="button" size="sm" variant={on ? "default" : "outline"} disabled={!hasValues(r.data)} className="whitespace-nowrap" onClick={() => toggle(r)}>
                          {on ? t("pos.measurements.selected") : t("pos.measurements.select")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="shrink-0 items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selected ? <>{t("pos.measurements.selectedOwner")}: <span className="font-bold text-foreground">{selected.name}</span></> : t("pos.measurements.none")}
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("pos1.close")}</Button>
        </DialogFooter>
    </>
  )
  if (embedded) return <EmbeddedDialog>{body}</EmbeddedDialog>
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">{body}</DialogContent>
    </Dialog>
  )
}
