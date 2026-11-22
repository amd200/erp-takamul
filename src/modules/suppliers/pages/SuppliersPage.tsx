import { useState } from "react"
import { Plus, Truck, WalletCards } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { formatMoney } from "@/lib/format"
import type { Supplier } from "../types"
import { SectionCard } from "@/components/SectionCard"
import { OpeningBalanceDialog } from "../components/OpeningBalanceDialog"
import { SupplierDialog } from "../components/SupplierDialog"
import { useDeleteSupplier, useSupplierList } from "../queries"

export default function SuppliersPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useSupplierList({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteSupplier()
  const [toDelete, setToDelete] = useState<Supplier | null>(null)
  // The add / edit pop-up: `{}` adds, `{ supplier }` edits the selected row.
  const [form, setForm] = useState<{ supplier?: Supplier } | null>(null)
  // The separate opening-balance pop-up for the selected row.
  const [opening, setOpening] = useState<Supplier | null>(null)
  const all = data ?? []

  const columns: Column<Supplier>[] = [
    { id: "supplierName", sortable: true, header: t("partners.name"), cell: (s) => <span className="font-semibold">{s.supplierName}</span> },
    { id: "phone", sortable: true, header: t("suppliers.mobile"), cell: (s) => <span dir="ltr">{s.phone || "—"}</span> },
    { id: "openingBalance", sortable: true, header: t("partners.openingBalance"), cell: (s) => <span dir="ltr">{formatMoney(s.openingBalance ?? 0)}</span> },
    { id: "actions", header: "", align: "end", cell: (s) => (
      <div className="flex items-center justify-center gap-0.5">
        <RowActions extra={[can(P.suppliers.edit) && { key: "opening", label: t("partners.openingBalance"), icon: <WalletCards />, onSelect: () => setOpening(s) }]} onEdit={can(P.suppliers.edit) ? () => setForm({ supplier: s }) : undefined} onDelete={can(P.suppliers.delete) ? () => setToDelete(s) : undefined} />
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader title={t("suppliers.title")} description={t("suppliers.description")}
        actions={<Can perm={P.suppliers.add}><Button size="lg" onClick={() => setForm({})}><Plus />{t("suppliers.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={all} loading={isLoading} columns={columns} sort={sort} rowKey={(s) => s.id}
            searchText={(s) => `${s.supplierName} ${s.phone} ${s.taxNumber}`} searchPlaceholder={t("suppliers.search")}
            empty={<EmptyState icon={<Truck />} title={t("suppliers.empty")} hint={t("suppliers.emptyHint")} />} />
        </SectionCard>
      <SupplierDialog open={!!form} onOpenChange={(o) => !o && setForm(null)} supplier={form?.supplier} />
      <OpeningBalanceDialog supplier={opening} onOpenChange={(o) => !o && setOpening(null)} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("suppliers.deleteTitle")} description={t("suppliers.deleteBody", { name: toDelete?.supplierName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
