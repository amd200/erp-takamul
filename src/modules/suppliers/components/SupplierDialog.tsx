import { useEffect } from "react"
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { FormInput } from "@/components/form/FormFields"
import { useAppSettings } from "@/modules/settings"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { useSaveSupplier } from "../queries"
import { COUNTRY_CODE, emptySupplier, supplierSchema, type SupplierForm } from "../schema"
import type { Supplier } from "../types"

/**
 * Add or edit a supplier, laid out like the customer pop-up: name and phone, the address fields on one row, and the national
 * address box (a switch that opens the tax number, commercial register and building details). `supplier` supplies the row to edit.
 */
export function SupplierDialog({ open, onOpenChange, supplier, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; supplier?: Supplier; /** Gets what the server answered for the saved supplier (a new one is then picked on the purchase screen). */ onSaved?: (saved: unknown) => void }) {
  const { t } = useTranslation()
  const save = useSaveSupplier()
  const form = useForm<SupplierForm>({ resolver: zodResolver(supplierSchema), defaultValues: emptySupplier })
  const national = useWatch({ control: form.control, name: "isNational" })
  // With the name-and-phone setting only those two show.
  const nameAndPhoneOnly = useAppSettings().suppliersTab?.showSupplierNameAndPhoneOnlyInPurchases === true
  const editing = !!supplier
  // The purchase screen adds to the branch it is working on; only the suppliers list picks one.
  const formBranch = useFormBranch(open && !editing && !onSaved)

  useEffect(() => { if (open) form.reset(supplier ? { ...emptySupplier, ...supplier, countryName: COUNTRY_CODE } : emptySupplier) }, [open, supplier, form])

  const submit = form.handleSubmit((data) => save.mutate({ id: supplier?.id, data }, { onSuccess: (saved) => { onOpenChange(false); onSaved?.(saved) } }))
  const c = form.control
  const title = editing ? t("supDialog.edit") : t("supDialog.add")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-3 overflow-hidden p-4 sm:max-w-[900px] sm:gap-4 sm:p-6">
        <DialogHeader className="shrink-0 py-2 sm:py-3">
          <DialogTitle className="flex items-center gap-2 text-primary"><UserPlus size={20} />{title}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="supplier-form" onSubmit={submit} noValidate className="-mx-1 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1 sm:-mx-4 sm:px-4">
            <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 sm:p-2">
              {formBranch.show && <BranchSection className="col-span-full" value={formBranch.branchId} onChange={formBranch.pick} />}
              <FormInput control={c} name="supplierName" required label={t("supDialog.name")} />
              <FormInput control={c} name="phone" label={t("custDialog.mobile")} />

              {!nameAndPhoneOnly && (
                <>
                  <div className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <FormInput control={c} name="countryName" label={t("custDialog.country")} disabled />
                    <FormInput control={c} name="stateName" label={t("custDialog.region")} />
                    <FormInput control={c} name="cityName" label={t("custDialog.city")} />
                    <FormInput control={c} name="district" label={t("custDialog.district")} />
                    <FormInput control={c} name="street" label={t("custDialog.street")} />
                  </div>

                  <div className="rounded-lg border border-border p-4 col-span-full">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-bold text-foreground">{t("custDialog.nationalAddress")}</h3>
                      <Controller control={c} name="isNational" render={({ field }) => <Switch className="shrink-0 cursor-pointer" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                    {national && (
                      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
                        <FormInput control={c} name="taxNumber" required label={t("custDialog.taxNumber")} dir="ltr" />
                        <FormInput control={c} name="commercialRegister" required label={t("custDialog.commercialRegister")} dir="ltr" />
                        <FormInput control={c} name="additionalNumber" required label={t("custDialog.additionalNumber")} />
                        <FormInput control={c} name="buildingNumber" required label={t("custDialog.buildingNumber")} />
                        <div className="sm:col-span-2"><FormInput control={c} name="postalCode" required label={t("custDialog.postalCode")} /></div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </form>
        </FormProvider>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="supplier-form" disabled={save.isPending}>{title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
