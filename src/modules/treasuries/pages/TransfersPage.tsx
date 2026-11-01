import { useEffect, useRef, useState } from "react"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftRight, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { Transfer } from "../types"
import { useDeleteTransfer, useTransfer, useTransferList, useTreasuryList } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import { emptyTransfer, transferSchema, type TransferForm } from "../schema"

function TransferDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { data: treasuries = [] } = useTreasuryList()
  const run = useTransfer()
  // One key per transfer being typed: a double click or a retry moves the money once.
  const key = useRef(newIdempotencyKey())
  const form = useForm<TransferForm>({ resolver: zodResolver(transferSchema), defaultValues: emptyTransfer() })
  const [fromTreasuryId, amount] = useWatch({ control: form.control, name: ["fromTreasuryId", "amount"] })
  const from = treasuries.find((x) => x.id === fromTreasuryId)
  const over = from?.currentBalance != null && (amount || 0) > from.currentBalance
  useEffect(() => { if (open) { form.reset(emptyTransfer()); key.current = newIdempotencyKey() } }, [open, form])
  const options = treasuries.map((x) => ({ value: String(x.id), label: `${x.name} — ${x.currentBalance == null ? "—" : formatMoney(x.currentBalance)}` }))
  const submit = form.handleSubmit((v) => !over && run.mutate({ ...v, key: key.current }, { onSuccess: () => onOpenChange(false), onError: renewIfReused(key) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("treasuries.newTransfer")}</DialogTitle></DialogHeader>
        <form id="transfer-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            <FormSelect control={form.control} name="fromTreasuryId" numeric required label={t("treasuries.from")} options={options} />
            <FormSelect control={form.control} name="toTreasuryId" numeric required label={t("treasuries.to")} options={options} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput control={form.control} name="amount" type="number" required label={t("sales.amount")} />
              <Controller control={form.control} name="date" render={({ field }) => (
                <Field><FieldLabel htmlFor="tr-date">{t("common.date")}</FieldLabel><Input id="tr-date" type="date" className="h-10" {...field} /></Field>
              )} />
            </div>
            {over && <p className="text-sm text-destructive">{t("treasuries.errors.insufficient")}</p>}
            <FormTextarea control={form.control} name="notes" label={t("common.notes")} placeholder={t("treasuries.transferHint")} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="transfer-form" disabled={run.isPending || over}>{t("treasuries.transfer")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TransfersPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useTransferList({ SortBy: sortBy, SortDescending: sortDescending })
  const { data: treasuries = [] } = useTreasuryList()
  const del = useDeleteTransfer()
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Transfer | null>(null)
  const name = (id: number) => treasuries.find((x) => x.id === id)?.name ?? "—"

  const columns: Column<Transfer>[] = [
    { id: "no", sortKey: "id", header: t("reports.c.doc"), cell: (x) => <span className="font-semibold">TRF-{x.id}</span> },
    { id: "date", sortKey: "date", header: t("common.date"), cell: (x) => <span className="text-muted-foreground">{formatDateTime(x.date, i18n.language)}</span> },
    { id: "route", sortKey: "fromTreasuryName", header: t("treasuries.route"), cell: (x) => (
      <span className="inline-flex items-center gap-2">{name(x.fromTreasuryId)}<ArrowLeftRight className="size-3.5 text-faint" />{name(x.toTreasuryId)}</span>
    ) },
    { id: "amount", sortKey: "amount", header: t("sales.amount"), cell: (x) => <span className="font-semibold">{formatMoney(x.amount)}</span> },
    { id: "notes", sortKey: "notes", header: t("common.notes"), cell: (x) => <span className="text-muted-foreground">{x.notes || "—"}</span> },
    { id: "actions", header: "", align: "end", cell: (x) => can(P.treasuries.transfers) && <RowActions onDelete={() => setToDelete(x)} /> },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.treasuries")]} title={t("treasuries.transfersTitle")} description={t("treasuries.transfersDescription")}
        actions={<Can perm={P.treasuries.transfers}><Button size="lg" onClick={() => setOpen(true)}><Plus />{t("treasuries.newTransfer")}</Button></Can>} />
      <SectionCard>
        <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(x) => x.id} searchText={(x) => `TRF-${x.id} ${x.notes ?? ""}`} searchPlaceholder={t("treasuries.searchTransfers")}
          empty={<EmptyState icon={<ArrowLeftRight />} title={t("treasuries.noTransfers")} hint={t("treasuries.noTransfersHint")} />} />
      </SectionCard>
      <TransferDialog open={open} onOpenChange={setOpen} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("treasuries.deleteTransferTitle")} description={t("treasuries.deleteTransferBody")}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
