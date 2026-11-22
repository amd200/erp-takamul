import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Inbox, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { useDeleteTax, useSaveTax, useTaxList } from "../queries"
import { taxSchema } from "../schema"
import type { Tax } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { name: string; amount: number | undefined }
const empty: Form = { name: "", amount: undefined }

function TaxDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: Tax | null }) {
  const { t } = useTranslation()
  const save = useSaveTax()
  const form = useForm<Form>({ resolver: zodResolver(taxSchema) as never, defaultValues: empty })
  useEffect(() => { if (open) form.reset(item ? { name: item.name, amount: item.amount } : empty) }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data: data as Omit<Tax, "id"> }, { onSuccess: () => onOpenChange(false) }))
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t(`settings.lists.taxes.${item ? "edit" : "add"}`)} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="name" label={t("settings.lists.taxes.name")} required />
      <FormInput control={form.control} name="amount" type="number" label={t("settings.lists.taxes.amount")} required />
    </FormDialog>
  )
}

export function TaxesList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useTaxList({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteTax()
  const [editing, setEditing] = useState<Tax | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<Tax | null>(null)
  const open = (r: Tax | null) => { setEditing(r); setDialog(true) }

  const columns: Column<Tax>[] = [
    { id: "name", sortable: true, header: t("settings.lists.taxes.name"), cell: (r) => <span className="font-semibold">{r.name}</span> },
    { id: "amount", sortable: true, header: t("settings.lists.taxes.amount"), cell: (r) => <span className="text-muted-foreground tabular-nums">{r.amount}%</span> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.taxes")} description={t("settings.sd.taxes")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{t("settings.lists.taxes.add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(r) => r.id} searchText={(r) => r.name} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={t("settings.lists.taxes.empty")} />} />
      <TaxDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("settings.lists.taxes.deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
