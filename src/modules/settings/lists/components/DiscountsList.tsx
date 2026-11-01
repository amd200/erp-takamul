import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Inbox, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { useCategories } from "@/modules/categories/queries"
import { useDeleteDiscount, useDiscounts, useSaveDiscount } from "../queries"
import { discountSchema } from "../schema"
import type { CategoryDiscount } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { categoryId: number | undefined; discountValue: number | undefined; discountType: CategoryDiscount["discountType"] }
const empty: Form = { categoryId: undefined, discountValue: undefined, discountType: "Percentage" }

function DiscountDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: CategoryDiscount | null }) {
  const { t } = useTranslation()
  const save = useSaveDiscount()
  const { data: categories = [] } = useCategories()
  const form = useForm<Form>({ resolver: zodResolver(discountSchema) as never, defaultValues: empty })
  useEffect(() => {
    if (open) form.reset(item ? { categoryId: item.categoryId, discountValue: item.discountValue, discountType: item.discountType } : empty)
  }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data: data as { categoryId: number; discountValue: number; discountType: CategoryDiscount["discountType"] } }, { onSuccess: () => onOpenChange(false) }))
  const label = (k: string) => t(`settings.lists.category_discounts.${k}`)
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={label(item ? "edit" : "add")} onSubmit={submit} pending={save.isPending}>
      <FormSelect control={form.control} name="categoryId" label={label("categoryId")} required numeric placeholder={t("settings.choose")}
        options={categories.map((c) => ({ value: String(c.id), label: c.categoryNameAr }))} />
      <FormInput control={form.control} name="discountValue" type="number" label={label("discountValue")} required />
      <FormSelect control={form.control} name="discountType" label={label("discountType")} required
        options={(["Percentage", "FixedAmount"] as const).map((v) => ({ value: v, label: label(`o.discountType.${v}`) }))} />
    </FormDialog>
  )
}

export function DiscountsList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useDiscounts({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteDiscount()
  const [editing, setEditing] = useState<CategoryDiscount | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<CategoryDiscount | null>(null)
  const open = (r: CategoryDiscount | null) => { setEditing(r); setDialog(true) }
  const label = (k: string) => t(`settings.lists.category_discounts.${k}`)

  const columns: Column<CategoryDiscount>[] = [
    { id: "category", sortKey: "categoryNameAr", header: label("categoryId"), cell: (r) => <span className="font-semibold">{r.categoryNameAr}</span> },
    { id: "value", sortKey: "discountValue", header: label("discountValue"), cell: (r) => <span className="tabular-nums">{r.discountValue}{r.discountType === "Percentage" ? "%" : ""}</span> },
    { id: "type", sortKey: "discountType", header: label("discountType"), cell: (r) => <span className="text-muted-foreground">{label(`o.discountType.${r.discountType}`)}</span> },
    { id: "active", sortKey: "isActive", header: label("isActive"), cell: (r) => <StatusBadge tone={r.isActive ? "success" : "danger"}>{t(r.isActive ? "common.active" : "common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && r.isActive && <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.category_discounts")} description={t("settings.sd.category_discounts")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{label("add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(r) => r.id} searchText={(r) => r.categoryNameAr} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={label("empty")} />} />
      <DiscountDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={label("deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.categoryNameAr })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
