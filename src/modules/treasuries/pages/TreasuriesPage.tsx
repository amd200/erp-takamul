import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Landmark, Plus, Trash2, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { Treasury } from "../types"
import { useDeleteTreasury, useSaveTreasury, useTreasuryList } from "../queries"
import { emptyTreasury, treasuryFormValues, treasurySchema, type TreasuryForm } from "../schema"

const num = (v: number | null | undefined) => v == null ? "—" : v.toLocaleString("en-US")

/** Add or edit a treasury, as in the current system: name and opening balance, its date, and the sales-screen box. */
function TreasuryDialog({ open, onOpenChange, treasury }: { open: boolean; onOpenChange: (o: boolean) => void; treasury: Treasury | null }) {
  const { t } = useTranslation()
  const save = useSaveTreasury()
  const form = useForm<TreasuryForm>({ resolver: zodResolver(treasurySchema), defaultValues: emptyTreasury() })
  useEffect(() => { if (open) form.reset(treasury ? treasuryFormValues(treasury) : emptyTreasury()) }, [open, treasury, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: treasury?.id, data }, { onSuccess: () => onOpenChange(false) }))
  const title = treasury ? t("oldTreasuries.editTitle") : t("oldTreasuries.addTitle")
  const shown = form.watch("showInSalesScreen")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-screen-sm">
        <DialogHeader className="py-3"><DialogTitle className="flex items-center gap-2 text-[#2ecc71]"><Wallet size={18} />{title}</DialogTitle></DialogHeader>
        <form id="treasury-form" onSubmit={submit} noValidate className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
          <div className="grid grid-cols-1 gap-5 p-2 md:grid-cols-2">
            <FormInput control={form.control} name="name" required label={t("oldTreasuries.nameLabel")} placeholder={t("oldTreasuries.nameHint")} />
            <FormInput control={form.control} name="openingBalance" type="number" label={t("oldTreasuries.opening")} placeholder="0" />
            <div className="md:col-span-2">
              <Controller control={form.control} name="openingBalanceDate" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="obd">{t("oldTreasuries.openingDate")}</FieldLabel><Input id="obd" type="date" {...field} aria-invalid={fieldState.invalid} /><FieldError>{fieldState.error && t(fieldState.error.message!)}</FieldError></Field>
              )} />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 md:col-span-2">
              <Checkbox id="treasury-in-sales" checked={shown ?? "indeterminate"} onCheckedChange={(c) => form.setValue("showInSalesScreen", c === true, { shouldValidate: true, shouldDirty: true })} />
              <label htmlFor="treasury-in-sales" className="cursor-pointer text-sm font-medium">{t("oldTreasuries.showInSales")}</label>
            </div>
            {form.formState.errors.showInSalesScreen && <FieldError>{t("validation.required")}</FieldError>}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="destructive" className="h-12 w-full px-6 text-base sm:w-auto" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="treasury-form" className="h-12 w-full px-6 text-base sm:w-auto" disabled={save.isPending}>{treasury ? t("oldTreasuries.saveChanges") : t("oldTreasuries.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Treasuries, laid out as in the current system: a titled box with an add button, and a plain table of code, name and balances. */
export default function TreasuriesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { data, isLoading } = useTreasuryList()
  const del = useDeleteTreasury()
  const [editing, setEditing] = useState<Treasury | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Treasury | null>(null)
  // Newest first, as the current system lists them.
  const rows = [...(data ?? [])].sort((a, b) => b.id - a.id)

  const columns: Column<Treasury>[] = [
    { id: "id", header: t("oldTreasuries.code"), cell: (x) => x.id },
    { id: "name", header: t("oldTreasuries.name"), cell: (x) => x.name || "—" },
    { id: "opening", header: t("oldTreasuries.opening"), cell: (x) => num(x.openingBalance) },
    { id: "currentBalance", header: t("oldTreasuries.current"), cell: (x) => num(x.currentBalance) },
    ...(can(P.treasuries.manage) ? [{ id: "actions", header: t("oldTreasuries.actions"), cell: (x: Treasury) => (
      <div className="space-x-2 rtl:space-x-reverse">
        <button type="button" className="btn-minimal-action btn-compact-action" aria-label={t("common.edit")} onClick={() => { setEditing(x); setOpen(true) }}><Edit2 size={16} /></button>
        <button type="button" className="btn-minimal-action btn-compact-action" aria-label={t("common.delete")} onClick={() => setToDelete(x)}><Trash2 size={16} /></button>
      </div>
    ) }] : []),
  ]

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl leading-snug font-bold"><Wallet size={20} className="text-primary" />{t("oldTreasuries.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("oldTreasuries.subtitle")}</p>
          </div>
          {can(P.treasuries.manage) && <Button onClick={() => { setEditing(null); setOpen(true) }}><Plus size={18} />{t("oldTreasuries.add")}</Button>}
        </div>
        <DataTable rows={rows} loading={isLoading} columns={columns} rowKey={(x) => x.id}
          searchText={(x) => [x.name, x.id, x.openingBalance].filter((v) => v != null).join(" ")} searchPlaceholder={t("oldTreasuries.search")}
          empty={<EmptyState icon={<Landmark />} title={t("oldTreasuries.empty")} />} />
      </div>
      <TreasuryDialog open={open} onOpenChange={setOpen} treasury={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("treasuries.deleteTitle")} description={t("treasuries.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
