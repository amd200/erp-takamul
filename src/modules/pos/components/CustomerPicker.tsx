import { useState } from "react"
import { Check, ChevronDown, Eye, History, User, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCustomers } from "@/modules/lookups/service"
import { usePosStore } from "../store"
import { CustomerMeasurementsDialog } from "./CustomerMeasurementsDialog"
import { CustomerMovementDialog } from "./CustomerMovementDialog"

/** Who the sale is for. No customer means a walk-in sale. */
export function CustomerPicker({ customerId, name, disabled, onPick, tools = true, clearable = true }: { customerId: number | null; name: string; disabled?: boolean; onPick: (id: number | null, name: string) => void
  /** The measurements and account-movement buttons next to the picker (the first sales screen has neither). */
  tools?: boolean
  /** The clear button beside a chosen customer (the second sales screen, like the current POS, has none). */
  clearable?: boolean }) {
  const { t } = useTranslation()
const { data: customers = [] } = useCustomers()
  const [open, setOpen] = useState(false)
  const [measurements, setMeasurements] = useState(false)
  const [movement, setMovement] = useState(false)
  const picked = usePosStore((s) => s.selectedMeasurement)
  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} className="h-11 flex-1 justify-between gap-2 bg-background font-normal">
            <span className="flex min-w-0 items-center gap-2"><User className="shrink-0 text-muted-foreground" /><span className={cn("truncate", !customerId && "text-muted-foreground")}>{customerId ? name : t("pos.pickCustomer")}</span></span>
            <ChevronDown className="shrink-0 text-faint" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <Command>
            <CommandInput placeholder={t("customers.search")} />
            <CommandList>
              <CommandEmpty>{t("pos.noCustomer")}</CommandEmpty>
              <CommandGroup>
                {customers.map((c) => (
                  <CommandItem key={c.id} value={`${c.customerName} ${c.phone}`} onSelect={() => { onPick(c.id, c.customerName); setOpen(false) }}>
                    <span className="flex-1 truncate">{c.customerName}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">{c.phone}</span>
                    {c.id === customerId && <Check />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {clearable && customerId && <Button type="button" variant="ghost" size="icon-lg" aria-label={t("pos.clearCustomer")} disabled={disabled} onClick={() => onPick(null, "")}><X /></Button>}
      {tools && (
        <>
        <Button type="button" variant="outline" size="icon-lg" aria-label={t("pos.measurements.title")} title={picked ? `${t("pos.measurements.selectedOwner")}: ${picked.name}` : t("pos.measurements.title")} onClick={() => setMeasurements(true)}
          className={cn("size-11! shrink-0 rounded-sm!", picked && "border-success! bg-success! text-white! hover:bg-success/90!")}><Eye /></Button>
        <Button type="button" variant="outline" size="icon-lg" aria-label={t("reports.movement.title")} title={t("reports.movement.title")} onClick={() => setMovement(true)} className="size-11! shrink-0 rounded-sm!"><History /></Button>
        </>
      )}
      {tools && <CustomerMeasurementsDialog open={measurements} onOpenChange={setMeasurements} customerId={customerId} />}
      {tools && <CustomerMovementDialog open={movement} onOpenChange={setMovement} customerId={customerId} />}
    </div>
  )
}
