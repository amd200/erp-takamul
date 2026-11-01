import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Tags } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSwitch } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { emptyExpenseItem, expenseItemSchema, type ExpenseItemForm } from "../schema"
import { useDeleteExpenseItem, useExpenseItems, useSaveExpenseItem } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { ExpenseItem } from "../types"

function ItemDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: ExpenseItem | null }) {
  const { t } = useTranslation()
  const save = useSaveExpenseItem()
  const form = useForm<ExpenseItemForm>({ resolver: zodResolver(expenseItemSchema), defaultValues: emptyExpenseItem })
  useEffect(() => { if (open) form.reset(item ? { name: item.name ?? "", isActive: item.isActive ?? true } : emptyExpenseItem) }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{item ? t("expenseItems.edit") : t("expenseItems.add")}</DialogTitle></DialogHeader>
        <form id="expense-item-form" onSubmit={submit}>
          <FieldGroup className="gap-4">
            <FormInput control={form.control} name="name" label={t("expenseItems.name")} placeholder={t("expenseItems.namePlaceholder")} required />
            {/* The server creates every item active, so the switch only shows when editing. */}
            {item && <FormSwitch control={form.control} name="isActive" label={t("common.active")} description={t("expenseItems.activeHint")} />}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="expense-item-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpenseItemsPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useExpenseItems({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteExpenseItem()
  const [editing, setEditing] = useState<ExpenseItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ExpenseItem | null>(null)
  const open = (x: ExpenseItem | null) => { setEditing(x); setDialogOpen(true) }

  const columns: Column<ExpenseItem>[] = [
    { id: "name", sortKey: "name", header: t("expenseItems.name"), cell: (x) => <span className="font-semibold">{x.name}</span> },
    { id: "status", sortKey: "isActive", header: t("common.status"), cell: (x) => <StatusBadge tone={x.isActive ? "success" : "danger"}>{x.isActive ? t("common.active") : t("common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (x) => can(P.expenseItems.manage) && <RowActions onEdit={() => open(x)} onDelete={() => setToDelete(x)} /> },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.expenses")]} title={t("expenseItems.title")} description={t("expenseItems.description")}
        actions={<Can perm={P.expenseItems.manage}><Button size="lg" onClick={() => open(null)}><Plus />{t("expenseItems.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(x) => x.id}
            searchText={(x) => x.name ?? ""} searchPlaceholder={t("expenseItems.search")}
            empty={<EmptyState icon={<Tags />} title={t("expenseItems.empty")} hint={t("expenseItems.emptyHint")} />} />
        </SectionCard>
      <ItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("expenseItems.deleteTitle")} description={t("expenseItems.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
