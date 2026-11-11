import { useEffect, useState } from "react"
import { customerFormOf } from "../form"
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { EmbeddedDialog } from "@/components/EmbeddedDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { FormInput } from "@/components/form/FormFields"
import { useAppSettings } from "@/modules/settings"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { customersApi } from "../service"
import { useSaveCustomer } from "../queries"
import { customerSchema, emptyCustomer, type CustomerForm } from "../schema"
import type { Customer } from "../types"
import { CompanionsBlock, EyePrescriptionBox } from "./EyePrescriptionBox"
import { customerKeys } from "../keys"

/**
 * Add or edit a customer, as in the current system: a pop-up with name and phone, the address fields, the national
 * address box (a switch that opens the tax number, commercial register and building details), the eye measurements,
 * and a dashed button that opens or closes the full data. A new customer starts on name and phone only.
 * `customer` supplies the row to edit; `onCreated` hands back the new one (the sales screen picks them straight away).
 */
export function CustomerDialog({ open, onOpenChange, customer, onCreated, withMeasurements = false, embedded = false, part = "all", closeOnSave = true, onSaved, nextFileNumber }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  customer?: Customer
  onCreated?: (id: number, name: string) => void
  /** The file number, eye prescription and companions: only the optics cashier has them; the customers list and the invoice forms do not. */
  withMeasurements?: boolean
  /** Shown inside the optics customer-tools window instead of as its own popup. */
  embedded?: boolean
  /** Which part of the form shows: the customer without companions, or the companions alone (the optics tools have a tab for each). */
  part?: "all" | "customer" | "companions"
  /** The optics tools stay open after a save and are told about it here. */
  closeOnSave?: boolean
  onSaved?: () => void
  /** The optics tools fill a new customer's file number with the next one (the newest customer's + 1). */
  nextFileNumber?: string
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const save = useSaveCustomer()
  const form = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: emptyCustomer })
  const national = useWatch({ control: form.control, name: "isNational" })
  // With the name-and-phone setting only those two show.
  const nameAndPhoneOnly = useAppSettings().customersTab?.showCustomerNameAndPhoneOnlyInQuotations === true
  const [showFull, setShowFull] = useState(false)
  // Only the optics cashier starts on name and phone with a button for the rest; elsewhere all the data shows.
  const collapsible = withMeasurements && !nameAndPhoneOnly
  const hideDetails = nameAndPhoneOnly || (collapsible && !showFull)
  const editing = !!customer
  // Only the customers list picks the branch; the sales screens and the optics tools add to the branch they are working on.
  const formBranch = useFormBranch(open && !editing && !embedded && !onCreated)

  useEffect(() => {
    if (!open) return
    form.reset(customer ? customerFormOf(customer) : { ...emptyCustomer, fileNumber: nextFileNumber ?? emptyCustomer.fileNumber })
    setShowFull(false)
  }, [open, customer, form]) // eslint-disable-line react-hooks/exhaustive-deps -- the next file number is read once, when the form opens

  const submit = form.handleSubmit((data) => save.mutate({ id: customer?.id, data }, {
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
      if (!editing && onCreated) {
        // The server answers with a message only, so the new customer is found by name and phone.
        const created = (await customersApi.list()).filter((c) => c.customerName === data.name && (c.phone ?? "") === data.phone).sort((a, b) => b.id - a.id)[0]
        if (created) onCreated(created.id, created.customerName)
      }
      onSaved?.()
      if (closeOnSave) onOpenChange(false)
    },
  }), (errors) => {
    // Don't leave an error hidden inside the collapsed details.
    if (Object.keys(errors).some((k) => k !== "name" && k !== "phone" && k !== "companions" && k !== "fileNumber")) setShowFull(true)
  })

  const c = form.control
  const body = (
    <>
        <DialogHeader className={cn("shrink-0 py-2 sm:py-3", embedded && "sr-only")}>
          <DialogTitle className="flex items-center gap-2 text-primary"><UserPlus size={20} />{editing ? t("custDialog.edit") : t("custDialog.add")}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="customer-form" onSubmit={submit} noValidate className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto", !embedded && "-mx-1 px-1 sm:-mx-4 sm:px-4")}>
            <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-3 sm:p-2">
              {part !== "companions" && <>
              {formBranch.show && <BranchSection className="col-span-full" value={formBranch.branchId} onChange={formBranch.pick} />}
              {withMeasurements && <FormInput control={c} name="fileNumber" label={t("custDialog.fileNumber")} />}
              <FormInput control={c} name="name" required label={t("custDialog.name")} />
              <FormInput control={c} name="phone" label={t("custDialog.mobile")} />

              {!hideDetails && (
                <>
                  <FormInput control={c} name="country" label={t("custDialog.country")} disabled />
                  <FormInput control={c} name="state" label={t("custDialog.region")} />
                  <FormInput control={c} name="city" label={t("custDialog.city")} />
                  <FormInput control={c} name="district" label={t("custDialog.district")} />
                  <div className="sm:col-span-2"><FormInput control={c} name="street" label={t("custDialog.street")} /></div>

                  <div className="rounded-lg border border-border p-4 col-span-full">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-bold text-foreground">{t("custDialog.nationalAddress")}</h3>
                      <Controller control={c} name="isNational" render={({ field }) => <Switch className="shrink-0 cursor-pointer" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                    {national && (
                      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                        <FormInput control={c} name="taxNumber" required label={t("custDialog.taxNumber")} dir="ltr" />
                        <FormInput control={c} name="commercialRegister" required label={t("custDialog.commercialRegister")} dir="ltr" />
                        <FormInput control={c} name="additionalNumber" required label={t("custDialog.additionalNumber")} />
                        <FormInput control={c} name="buildingNumber" required label={t("custDialog.buildingNumber")} />
                        <FormInput control={c} name="postalCode" required label={t("custDialog.postalCode")} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {withMeasurements && <EyePrescriptionBox />}

              {collapsible && (
                <Button type="button" variant="outline" className="h-11 gap-2 border-dashed col-span-full border-primary/60 text-primary hover:bg-primary/5 hover:text-primary" onClick={() => setShowFull((v) => !v)}>
                  {showFull ? <ChevronUp size={18} /> : <ChevronDown size={18} />}{showFull ? t("custDialog.hideFull") : t("custDialog.showFull")}
                </Button>
              )}

              </>}

              {withMeasurements && part !== "customer" && <CompanionsBlock />}
            </div>
          </form>
        </FormProvider>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="destructive" className="h-12 w-full px-6 text-base sm:w-auto" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="customer-form" className="h-12 w-full px-6 text-base sm:w-auto" disabled={save.isPending}>{editing ? t("custDialog.edit") : t("custDialog.add")}</Button>
        </DialogFooter>
    </>
  )
  if (embedded) return <EmbeddedDialog>{body}</EmbeddedDialog>
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-3 overflow-hidden p-4 sm:max-w-[900px] sm:gap-4 sm:p-6">{body}</DialogContent>
    </Dialog>
  )
}
