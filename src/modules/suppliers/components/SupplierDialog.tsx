import { useEffect } from "react"
import { supplierFormOf } from "../form"
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
import { emptySupplier, supplierSchema, type SupplierForm } from "../schema"
import type { Supplier } from "../types"

/**
 * Add or edit a supplier, as in the current system: a pop-up with name and phone, the address fields, and the national
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

  useEffect(() => { if (open) form.reset(supplier ? supplierFormOf(supplier) : emptySupplier) }, [open, supplier, form])

  const submit = form.handleSubmit((data) => save.mutate({ id: supplier?.id, data }, { onSuccess: (saved) => { onOpenChange(false); onSaved?.(saved) } }))
  const c = form.control
  const title = editing ? t("supDialog.edit") : t("supDialog.add")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-3 overflow-hidden p-4 sm:max-w-screen-sm sm:gap-4 sm:p-6">
        <DialogHeader className="shrink-0 py-2 sm:py-3">
          <DialogTitle className="flex items-center gap-2 text-primary"><UserPlus size={20} />{title}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="supplier-form" onSubmit={submit} noValidate className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 sm:-mx-4 sm:px-4">
            <div className="grid grid-cols-2 gap-4 p-1 sm:gap-5 sm:p-2">
              {formBranch.show && <BranchSection className="col-span-2" value={formBranch.branchId} onChange={formBranch.pick} />}
              <FormInput control={c} name="name" required label={t("supDialog.name")} placeholder={t("supDialog.nameHint")} />
              <FormInput control={c} name="phone" label={t("custDialog.mobile")} placeholder={t("custDialog.mobileHint")} />

              {!nameAndPhoneOnly && (
                <>
                  <FormInput control={c} name="country" label={t("custDialog.country")} placeholder={t("custDialog.countryHint")} disabled />
                  <FormInput control={c} name="state" label={t("custDialog.region")} placeholder={t("custDialog.regionHint")} />
                  <FormInput control={c} name="city" label={t("custDialog.city")} placeholder={t("custDialog.cityHint")} />
                  <FormInput control={c} name="district" label={t("custDialog.district")} placeholder={t("custDialog.districtHint")} />
                  <div className="col-span-2"><FormInput control={c} name="street" label={t("custDialog.street")} placeholder={t("custDialog.streetHint")} /></div>

                  <div className="col-span-2 my-2 w-full rounded-2xl border border-border p-5">
                    <div className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">{t("custDialog.nationalAddress")}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t("supDialog.vatHint")}</p>
                      </div>
                      <Controller control={c} name="isNational" render={({ field }) => <Switch className="shrink-0 scale-130 cursor-pointer" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                    {national && (
                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
                        <FormInput control={c} name="taxNumber" required label={t("custDialog.taxNumber")} placeholder={t("custDialog.taxNumberHint")} dir="ltr" />
                        <FormInput control={c} name="commercialRegister" required label={t("custDialog.commercialRegister")} placeholder={t("custDialog.commercialRegisterHint")} dir="ltr" />
                      </div>
                    )}
                  </div>

                  {national && (
                    <>
                      <FormInput control={c} name="additionalNumber" required label={t("custDialog.additionalNumber")} placeholder={t("custDialog.additionalNumberHint")} />
                      <FormInput control={c} name="buildingNumber" required label={t("custDialog.buildingNumber")} placeholder={t("custDialog.buildingNumberHint")} />
                      <div className="col-span-2"><FormInput control={c} name="postalCode" required label={t("custDialog.postalCode")} placeholder={t("custDialog.postalCodeHint")} /></div>
                    </>
                  )}
                </>
              )}
            </div>
          </form>
        </FormProvider>

        <DialogFooter>
          <Button type="button" variant="destructive" className="h-12 w-full px-6 text-base sm:w-auto" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="supplier-form" className="h-12 w-full px-6 text-base sm:w-auto" disabled={save.isPending}>{title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
