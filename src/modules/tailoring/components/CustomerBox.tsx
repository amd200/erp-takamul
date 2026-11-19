import { useRef, useState } from "react"
import { Phone, Ruler, Search, UserPlus, UserRound, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { filledCount, useTailoringStore } from "../store"
import { MEASURE_KEYS } from "../types"
import { NewCustomerDialog } from "./NewCustomerDialog"

/**
 * Picks the order's customer, whose saved measurements come with them, or adds a new one (name, phone and measurements
 * in one window). `onMeasures` opens the measurements for a look or a change.
 */
export function CustomerBox({ onMeasures }: { onMeasures: () => void }) {
  const { t } = useTranslation()
  const customer = useTailoringStore((s) => s.customer)
  const customers = useTailoringStore((s) => s.customers)
  const measurements = useTailoringStore((s) => s.measurements)
  const setCustomer = useTailoringStore((s) => s.setCustomer)
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)

  const q = term.trim()
  const found = customers.filter((c) => !q || c.name.includes(q) || c.phone.includes(q))

  if (customer) {
    const n = filledCount(measurements)
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 p-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{customer.name.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{customer.name}</p>
            {customer.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" /><span dir="ltr" className="tabular-nums">{customer.phone}</span></p>}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" title={t("tailoring.customer.change")} aria-label={t("tailoring.customer.change")} onClick={() => setCustomer(null)}><X /></Button>
        </div>
        <div className={cn("flex items-center gap-2 border-t px-3 py-2 text-xs", n ? "text-success" : "text-warning")}>
          <Ruler className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{n ? t("tailoring.customer.measuresSaved", { n, total: MEASURE_KEYS.length }) : t("tailoring.customer.noMeasures")}</span>
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onMeasures}>{n ? t("tailoring.customer.viewMeasures") : t("tailoring.customer.takeMeasures")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={anchor} className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
              placeholder={t("tailoring.customer.search")} aria-label={t("tailoring.customer.search")} className="h-11 ps-9" />
          </div>
        </PopoverAnchor>
        <PopoverContent className="p-1" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => { if (anchor.current?.contains(e.target as Node)) e.preventDefault() }} align="start" sideOffset={4}>
          {found.length === 0 ? <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t("tailoring.customer.noResults")}</p> : (
            <div className="max-h-64 overflow-y-auto">
              {found.map((c) => (
                <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCustomer(c); setOpen(false); setTerm("") }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start transition-colors hover:bg-muted">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" size="icon-lg" className="size-11 border-primary text-primary hover:bg-primary/10 hover:text-primary" title={t("tailoring.customer.add")} aria-label={t("tailoring.customer.add")} onClick={() => setAdding(true)}><UserPlus /></Button>
      <NewCustomerDialog open={adding} onOpenChange={setAdding} />
    </div>
  )
}
