import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Inbox, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { useDeleteTable, useSaveTable, useTables } from "../queries"
import { tableSchema } from "../schema"
import type { DiningTable } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { tableName: string }
const empty: Form = { tableName: "" }

function TableDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: DiningTable | null }) {
  const { t } = useTranslation()
  const save = useSaveTable()
  const form = useForm<Form>({ resolver: zodResolver(tableSchema), defaultValues: empty })
  useEffect(() => { if (open) form.reset(item ? { tableName: item.tableName } : empty) }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data }, { onSuccess: () => onOpenChange(false) }))
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t(`settings.lists.tables.${item ? "edit" : "add"}`)} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="tableName" label={t("settings.lists.tables.tableName")} required />
    </FormDialog>
  )
}

export function TablesList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading } = useTables()
  const del = useDeleteTable()
  const [editing, setEditing] = useState<DiningTable | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<DiningTable | null>(null)
  const open = (r: DiningTable | null) => { setEditing(r); setDialog(true) }

  const columns: Column<DiningTable>[] = [
    { id: "name", header: t("settings.lists.tables.tableName"), cell: (r) => <span className="font-semibold">{r.tableName}</span> },
    { id: "status", header: t("settings.lists.tables.status"), cell: (r) => <span className="text-muted-foreground">{t(`settings.lists.tables.o.status.${r.status}`)}</span> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.tables")} description={t("settings.sd.tables")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{t("settings.lists.tables.add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} rowKey={(r) => r.id} searchText={(r) => r.tableName} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={t("settings.lists.tables.empty")} />} />
      <TableDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("settings.lists.tables.deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.tableName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
