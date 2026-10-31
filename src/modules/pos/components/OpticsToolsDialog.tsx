import { useEffect, useState } from "react"
import { Eye, Pencil, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { useCustomer } from "@/modules/customers/queries"
import { useCustomers } from "@/modules/lookups/service"
import { VoucherDialog } from "@/modules/vouchers/components/VoucherDialog"
import { P } from "@/shared/permissions/permissions"
import { useCan } from "@/shared/permissions/usePermission"
import { PartyPicker } from "../grid/PartyPicker"
import { usePosStore } from "../store"
import { CustomerMeasurementsDialog } from "./CustomerMeasurementsDialog"
import { CustomerMovementDialog } from "./CustomerMovementDialog"

type Tab = "customer" | "companion" | "measurements" | "movement" | "receipt"

/** Picks the customer the tab works on; the pick is shared with the sale. */
function CustomerSelect({ customerId, placeholder }: { customerId: number | null; placeholder: string }) {
  const { t } = useTranslation()
  const { data: customers = [] } = useCustomers()
  return (
    <PartyPicker parties={customers.map((c) => ({ id: c.id, name: c.customerName, phone: c.phone ?? "" }))} value={customerId ?? 0}
      onPick={(p) => usePosStore.getState().setCustomer(p.id, p.name)} placeholder={placeholder} searchPlaceholder={t("customers.search")} empty={t("pos.noCustomer")} />
  )
}

/** Add a customer, or edit the one picked (the sale's customer), with the file number and eye prescription. */
function CustomerTab({ customerId, onClose }: { customerId: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<"add" | "edit">(customerId ? "edit" : "add")
  const { data: customer, isLoading } = useCustomer(mode === "edit" && customerId ? customerId : undefined)
  const { data: customers = [] } = useCustomers()
  // Shown and saved as the new customer's file number: the newest customer's number + 1, or 1 when it can't be read.
  const newest = customers.reduce<(typeof customers)[number] | null>((last, c) => (!last || c.id > last.id ? c : last), null)
  const lastFile = Number(newest?.fileNumber?.trim())
  const nextFileNumber = String(Number.isSafeInteger(lastFile) && lastFile > 0 ? lastFile + 1 : 1)
  const close = (o: boolean) => { if (!o) onClose() }
  return (
    <>
      <div role="group" aria-label={t("pos.optics.customer")} className="flex shrink-0 gap-2">
        <Button type="button" variant={mode === "add" ? "default" : "outline"} aria-pressed={mode === "add"} className={cn("h-10 gap-2", mode !== "add" && "border-primary text-primary hover:bg-primary/10 hover:text-primary")} onClick={() => setMode("add")}><UserPlus size={16} />{t("pos.optics.addCustomer")}</Button>
        <Button type="button" variant={mode === "edit" ? "default" : "outline"} aria-pressed={mode === "edit"} className={cn("h-10 gap-2", mode !== "edit" && "border-primary text-primary hover:bg-primary/10 hover:text-primary")} onClick={() => setMode("edit")}><Pencil size={16} />{t("pos.optics.editCustomer")}</Button>
      </div>
      {mode === "edit" && <CustomerSelect customerId={customerId} placeholder={t("pos.optics.pickToEdit")} />}
      {mode === "edit" ? (
        !customerId ? <p className="py-6 text-center text-sm text-muted-foreground">{t("pos.optics.pickToEdit")}</p>
          : isLoading || !customer ? <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
            : <CustomerDialog key={`edit-${customerId}`} embedded open onOpenChange={close} customer={customer} withMeasurements part="customer" closeOnSave={false}
                onSaved={() => usePosStore.getState().setMeasurement(null)} />
      ) : (
        <CustomerDialog key="new" embedded open onOpenChange={close} nextFileNumber={nextFileNumber} withMeasurements part="customer" closeOnSave={false}
          onCreated={(id, name) => { usePosStore.getState().setCustomer(id, name); setMode("edit") }} />
      )}
    </>
  )
}

/** The companions of the picked customer (their own eye prescriptions), saved with the customer. */
function CompanionTab({ customerId, onClose }: { customerId: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: customer, isLoading } = useCustomer(customerId ?? undefined)
  if (!customerId) return <CustomerSelect customerId={null} placeholder={t("pos.optics.searchCustomer")} />
  if (isLoading || !customer) return <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
  return <CustomerDialog key={`companions-${customerId}`} embedded open onOpenChange={(o) => { if (!o) onClose() }} customer={customer} withMeasurements part="companions" closeOnSave={false}
    onSaved={() => usePosStore.getState().setMeasurement(null)} />
}

/**
 * The optics screen's customer tools in one window, as in the current POS: add or edit the customer, their companions,
 * their measurements (pick whose go on the invoice), their movement report and a receipt from them.
 */
export function OpticsToolsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const can = useCan()
  const canMovement = can(P.reports.customers)
  const customerId = usePosStore((s) => s.customerId)
  const [tab, setTab] = useState<Tab>("customer")
  const active = tab === "movement" && !canMovement ? "customer" : tab
  const close = () => onOpenChange(false)

  useEffect(() => { if (open) setTab("customer") }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(48rem,calc(100dvh-1rem))] w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden p-4 sm:h-[min(48rem,92dvh)] sm:max-w-5xl sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary"><Eye size={20} />{t("pos.optics.tools")}</DialogTitle>
          <DialogDescription className="sr-only">{t("pos.optics.tools")}</DialogDescription>
        </DialogHeader>
        <Tabs value={active} onValueChange={(v) => { if (v !== "movement" || canMovement) setTab(v as Tab) }} className="min-h-0 flex-1 gap-3">
          <TabsList className="h-auto w-full shrink-0 justify-start overflow-x-auto overflow-y-hidden sm:w-fit">
            <TabsTrigger value="customer" className="px-4 py-1.5">{t("pos.optics.customer")}</TabsTrigger>
            <TabsTrigger value="companion" className="px-4 py-1.5">{t("pos.optics.companion")}</TabsTrigger>
            <TabsTrigger value="measurements" className="px-4 py-1.5">{t("pos.optics.measurements")}</TabsTrigger>
            {canMovement && <TabsTrigger value="movement" className="px-4 py-1.5">{t("pos.optics.movement")}</TabsTrigger>}
            <TabsTrigger value="receipt" className="px-4 py-1.5">{t("pos.optics.receipt")}</TabsTrigger>
          </TabsList>
          <TabsContent value="customer" className="flex min-h-0 flex-1 flex-col gap-3"><CustomerTab key={open ? "open" : "closed"} customerId={customerId} onClose={close} /></TabsContent>
          <TabsContent value="companion" className="flex min-h-0 flex-1 flex-col gap-3"><CompanionTab customerId={customerId} onClose={close} /></TabsContent>
          <TabsContent value="measurements" className="flex min-h-0 flex-1 flex-col"><CustomerMeasurementsDialog embedded open={open} onOpenChange={(o) => { if (!o) close() }} customerId={customerId} /></TabsContent>
          {canMovement && <TabsContent value="movement" className="flex min-h-0 flex-1 flex-col"><CustomerMovementDialog embedded open={open && active === "movement"} onOpenChange={(o) => { if (!o) close() }} customerId={customerId} /></TabsContent>}
          <TabsContent value="receipt" className="flex min-h-0 flex-1 flex-col"><VoucherDialog key={customerId ?? "none"} kind="receipt" embedded open={open} onOpenChange={(o) => { if (!o) close() }} customerId={customerId} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
