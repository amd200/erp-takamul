import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { WalletCards } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FormInput } from "@/components/form/FormFields"
import { openingBalanceSchema, type OpeningBalanceForm } from "../schema"
import type { PartyDto } from "../types"

const today = () => new Date().toISOString().slice(0, 10)

/** The opening balance of a customer or supplier on its own: amount, date and side, saved apart from the full form. */
export function PartyOpeningBalanceDialog({ party, title, defaultType, pending, onSave, onOpenChange }: {
  party: PartyDto | null
  title: string
  /** The side used when the record has none (the server's own default: customers Debit, suppliers Credit). */
  defaultType: "Debit" | "Credit"
  pending: boolean
  onSave: (values: OpeningBalanceForm) => void
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useTranslation()
  const form = useForm<OpeningBalanceForm>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: { openingBalance: 0, openingBalanceType: defaultType, openingBalanceDate: today() },
  })

  useEffect(() => {
    if (!party) return
    form.reset({
      openingBalance: party.openingBalance ?? 0,
      openingBalanceType: party.openingBalanceType ?? defaultType,
      openingBalanceDate: party.openingBalanceDate?.slice(0, 10) || today(),
    })
  }, [party, defaultType, form])

  return (
    <Dialog open={!!party} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary"><WalletCards size={20} />{title}</DialogTitle>
        </DialogHeader>
        <form id="party-opening-form" onSubmit={form.handleSubmit(onSave)} noValidate className="grid gap-4 py-2">
          <FormInput control={form.control} name="openingBalance" type="number" label={t("partners.openingBalance")} />
          <FormInput control={form.control} name="openingBalanceDate" type="date" label={t("common.date")} />
          <Controller control={form.control} name="openingBalanceType" render={({ field }) => (
            <Field>
              <FieldLabel>{t("partners.balanceSide")}</FieldLabel>
              <ToggleGroup type="single" variant="outline" value={field.value} onValueChange={(v) => v && field.onChange(v)} className="w-full">
                <ToggleGroupItem value="Debit" className="h-10 flex-1 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">{t("partners.debit")}</ToggleGroupItem>
                <ToggleGroupItem value="Credit" className="h-10 flex-1 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">{t("partners.credit")}</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          )} />
          <p className="text-xs text-muted-foreground">{t("partners.openingHint")}</p>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>{t("common.cancel")}</Button>
          <Button type="submit" form="party-opening-form" disabled={pending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
