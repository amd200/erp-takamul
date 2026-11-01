import { useState } from "react"
import { Plus, UsersRound } from "lucide-react"
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
import type { Customer } from "../types"
import { SectionCard } from "@/components/SectionCard"
import { CustomerDialog } from "../components/CustomerDialog"
import { useCustomerList, useDeleteCustomer } from "../queries"

export default function CustomersPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useCustomerList({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteCustomer()
  const [toDelete, setToDelete] = useState<Customer | null>(null)
  // The add / edit pop-up: `{}` adds, `{ customer }` edits the selected row.
  const [form, setForm] = useState<{ customer?: Customer } | null>(null)

  const all = data ?? []

  const columns: Column<Customer>[] = [
    { id: "code", sortKey: "id", header: t("customers.code"), cell: (c) => <span className="tabular-nums">{c.customerCode ?? c.id}</span> },
    { id: "name", sortKey: "customerName", header: t("partners.name"), cell: (c) => <span className="font-semibold">{c.customerName}</span> },
    { id: "phone", sortKey: "phone", header: t("customers.mobile"), cell: (c) => <span dir="ltr">{c.phone || "—"}</span> },
    { id: "openingBalance", sortKey: "openingBalance", header: t("partners.openingBalance"), cell: (c) => <span dir="ltr">{formatMoney(c.openingBalance ?? 0)}</span> },
    { id: "actions", header: "", align: "end", cell: (c) => (
      <div className="flex items-center justify-end gap-0.5">
        <RowActions onEdit={can(P.customers.edit) ? () => setForm({ customer: c }) : undefined}
          onDelete={can(P.customers.delete) && c.id !== 1 ? () => setToDelete(c) : undefined} />
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.customers")]} title={t("customers.title")} description={t("customers.description")}
        actions={<Can perm={P.customers.add}><Button size="lg" onClick={() => setForm({})}><Plus />{t("customers.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={all} loading={isLoading} columns={columns} sort={sort} rowKey={(c) => c.id}
            searchText={(c) => `${c.customerName} ${c.phone} ${c.taxNumber} ${c.customerCode ?? c.id}`} searchPlaceholder={t("customers.search")}
            empty={<EmptyState icon={<UsersRound />} title={t("customers.empty")} hint={t("customers.emptyHint")} />} />
        </SectionCard>
      <CustomerDialog open={!!form} onOpenChange={(o) => !o && setForm(null)} customer={form?.customer} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("customers.deleteTitle")} description={t("customers.deleteBody", { name: toDelete?.customerName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
