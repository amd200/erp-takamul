import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Ruler, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormInput } from "@/components/form/FormFields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { newCustomerSchema, type NewCustomerForm } from "../schema"
import { emptyMeasurements, filledCount, useTailoringStore } from "../store"
import { MEASURE_KEYS } from "../types"
import { MeasureFields } from "./MeasurementsPanel"

/** Adds a new customer: name and phone, and their measurements taken right away (they can also be finished later). */
export function NewCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const addCustomer = useTailoringStore((s) => s.addCustomer)
  const form = useForm<NewCustomerForm>({ resolver: zodResolver(newCustomerSchema), defaultValues: { name: "", phone: "" } })
  const [measurements, setMeasurements] = useState(emptyMeasurements)

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) { form.reset(); setMeasurements(emptyMeasurements()) }
  }
  const save = form.handleSubmit((v) => {
    addCustomer({ name: v.name, phone: v.phone, measurements })
    close(false)
  })

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" />{t("tailoring.customer.newTitle")}</DialogTitle></DialogHeader>
        <form id="tailor-customer" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput control={form.control} name="name" label={t("tailoring.customer.name")} required />
            <FormInput control={form.control} name="phone" label={t("tailoring.customer.phone")} dir="ltr" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Ruler className="size-4 text-primary" />
            <h3 className="text-sm font-bold">{t("tailoring.customer.measures")}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary tabular-nums">{t("tailoring.measures.filled", { n: filledCount(measurements), total: MEASURE_KEYS.length })}</span>
            <span className="ms-auto text-xs text-muted-foreground">{t("tailoring.customer.measuresLater")}</span>
          </div>
          <MeasureFields value={measurements} onChange={(k, v) => setMeasurements((m) => ({ ...m, [k]: v }))} />
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="tailor-customer">{t("tailoring.customer.saveNew")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
