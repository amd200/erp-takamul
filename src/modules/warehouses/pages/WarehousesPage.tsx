import { useEffect, useState } from "react"
import { useBranchColumn } from "@/modules/branches/useBranchColumn"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Store } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { formatNumber } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import type { Warehouse } from "../types"
import { useDeleteWarehouse, useSaveWarehouse, useWarehouseList } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import { emptyWarehouse, warehouseFormValues, warehouseSchema, type WarehouseForm } from "../schema"

function WarehouseDialog({ open, onOpenChange, warehouse }: { open: boolean; onOpenChange: (o: boolean) => void; warehouse: Warehouse | null }) {
  const { t } = useTranslation()
  const save = useSaveWarehouse()
  const formBranch = useFormBranch(open && !warehouse)
  const form = useForm<WarehouseForm>({ resolver: zodResolver(warehouseSchema), defaultValues: emptyWarehouse })
  useEffect(() => { if (open) form.reset(warehouse ? warehouseFormValues(warehouse) : emptyWarehouse) }, [open, warehouse, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: warehouse?.id, data }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-16px)] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader><DialogTitle>{warehouse ? t("warehouses.edit") : t("warehouses.add")}</DialogTitle></DialogHeader>
        <form id="warehouse-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            {formBranch.show && <BranchSection value={formBranch.branchId} onChange={formBranch.pick} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput control={form.control} name="warehouseCode" required label={t("warehouses.code")} dir="ltr" disabled={!!warehouse} />
              <FormInput control={form.control} name="warehouseName" required label={t("warehouses.name")} />
            </div>
            <FormInput control={form.control} name="address" label={t("warehouses.address")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput control={form.control} name="city" label={t("partners.city")} disabled={!warehouse} />
              <FormInput control={form.control} name="state" label={t("partners.state")} disabled={!warehouse} />
            </div>
            <FormInput control={form.control} name="capacity" type="number" label={t("warehouses.capacity")} disabled={!warehouse} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="warehouse-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function WarehousesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useWarehouseList({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteWarehouse()
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Warehouse | null>(null)

  const branchColumn = useBranchColumn<Warehouse>((w) => ({ id: w.branchId, name: w.branchName }))
  const columns: Column<Warehouse>[] = [
    { id: "code", sortKey: "warehouseCode", header: t("warehouses.code"), cell: (w) => <span className="font-semibold" dir="ltr">{w.warehouseCode || "—"}</span> },
    { id: "name", sortKey: "warehouseName", header: t("warehouses.name"), cell: (w) => <span className="font-semibold">{w.warehouseName || "—"}</span> },
    ...branchColumn,
    { id: "address", sortKey: "address", header: t("warehouses.address"), cell: (w) => <span className="text-muted-foreground">{[w.address, w.city].filter(Boolean).join("، ") || "—"}</span> },
    { id: "capacity", sortKey: "capacity", header: t("warehouses.capacity"), cell: (w) => (w.capacity != null ? formatNumber(w.capacity) : <span className="text-faint">—</span>) },
    { id: "manager", sortKey: "managerName", header: t("warehouses.manager"), cell: (w) => w.managerName || <span className="text-faint">—</span> },
    { id: "status", sortKey: "isActive", header: t("common.status"), cell: (w) => w.isActive == null ? <span className="text-faint">—</span> : <StatusBadge tone={w.isActive ? "success" : "danger"}>{w.isActive ? t("common.active") : t("common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (w) => (
      <RowActions onEdit={can(P.warehouses.edit) ? () => { setEditing(w); setOpen(true) } : undefined} onDelete={can(P.warehouses.delete) ? () => setToDelete(w) : undefined} />
    ) },
  ]

  return (
    <>
      <PageHeader title={t("warehouses.title")} description={t("warehouses.description")}
        actions={<Can perm={P.warehouses.add}><Button size="lg" onClick={() => { setEditing(null); setOpen(true) }}><Plus />{t("warehouses.add")}</Button></Can>} />
      <SectionCard>
        <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(w) => w.id} searchText={(w) => [w.warehouseCode, w.warehouseName, w.address].filter(Boolean).join(" ")} searchPlaceholder={t("warehouses.search")}
          empty={<EmptyState icon={<Store />} title={t("warehouses.empty")} hint={t("warehouses.emptyHint")} />} />
      </SectionCard>
      <WarehouseDialog open={open} onOpenChange={setOpen} warehouse={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("warehouses.deleteTitle")} description={t("warehouses.deleteBody", { name: toDelete?.warehouseName || "—" })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
