import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { FileText, Landmark, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/PageHeader"
import { CURRENCY } from "@/modules/settings"
import { formatMoney } from "@/lib/format"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { Treasury } from "../types"
import { useDeleteTreasury, useSaveTreasury, useTreasuryList } from "../queries"
import { emptyTreasury, treasuryFormValues, treasurySchema, type TreasuryForm } from "../schema"

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
            <div className="flex items-center gap-3 rounded-2xl border border-border p-3 md:col-span-2">
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

/** Treasuries as cards with the total balance, in both looks. */
export default function TreasuriesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { data, isLoading } = useTreasuryList()
  const del = useDeleteTreasury()
  const [editing, setEditing] = useState<Treasury | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Treasury | null>(null)
  const all = data ?? []
  const total = all.reduce((sum, x) => sum + (x.currentBalance ?? 0), 0)
  return (
    <>
      <PageHeader crumbs={[t("nav.treasuries")]} title={t("treasuries.title")} description={t("treasuries.description")}
        actions={can(P.treasuries.manage) ? <Button size="lg" onClick={() => { setEditing(null); setOpen(true) }}><Plus />{t("treasuries.add")}</Button> : undefined} />
      <div className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3 sm:w-72">
        <span className="text-xs text-muted-foreground">{t("treasuries.total")}</span>
        <span className="text-xl font-bold tabular-nums">{formatMoney(total)} <span className="text-xs font-normal text-muted-foreground">{CURRENCY}</span></span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : all.length === 0 ? (
        <Card><EmptyState icon={<Landmark />} title={t("treasuries.empty")} hint={t("treasuries.emptyHint")} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {all.map((tr) => (
            <Card key={tr.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark className="size-4 text-muted-foreground" />{tr.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-1.5">
                  {tr.showInSalesScreen && <Badge variant="secondary">{t("treasuries.inSales")}</Badge>}
                </CardDescription>
                {can(P.treasuries.manage) && (
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t("common.actions")}><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => { setEditing(tr); setOpen(true) }}><Pencil />{t("common.edit")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(tr)}><Trash2 />{t("common.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{t("treasuries.balance")}</div>
                  <div className={`text-2xl font-bold tabular-nums ${(tr.currentBalance ?? 0) < 0 ? "text-destructive" : ""}`}>{formatMoney(tr.currentBalance ?? 0)}</div>
                </div>
                <Button asChild variant="outline"><Link to={`/treasuries/statement?treasury=${tr.id}`}><FileText />{t("treasuries.statement")}</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TreasuryDialog open={open} onOpenChange={setOpen} treasury={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("treasuries.deleteTitle")} description={t("treasuries.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
