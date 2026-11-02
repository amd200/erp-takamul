import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Inbox, Plus, Star } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSwitch } from "@/components/form/FormFields"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { errorToast } from "@/shared/api/errors"
import { currencyKeys, useCurrencies, useDeleteCurrency, useSaveCurrency } from "../queries"
import { currencySchema } from "../schema"
import { currenciesApi } from "../service"
import type { Currency } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { code: string; name: string; symbol: string; isDefault: boolean }
const empty: Form = { code: "", name: "", symbol: "", isDefault: false }

function CurrencyDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: Currency | null }) {
  const { t } = useTranslation()
  const save = useSaveCurrency()
  const form = useForm<Form>({ resolver: zodResolver(currencySchema), defaultValues: empty })
  useEffect(() => { if (open) form.reset(item ?? empty) }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data }, { onSuccess: () => onOpenChange(false) }))
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t(`settings.lists.currencies.${item ? "edit" : "add"}`)} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="code" label={t("settings.lists.currencies.code")} dir="ltr" required />
      <FormInput control={form.control} name="name" label={t("settings.lists.currencies.name")} required />
      <FormInput control={form.control} name="symbol" label={t("settings.lists.currencies.symbol")} required />
      <FormSwitch control={form.control} name="isDefault" label={t("settings.lists.currencies.isDefault")} />
    </FormDialog>
  )
}

export function CurrenciesList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useCurrencies({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteCurrency()
  const makeDefault = useMutation({
    mutationFn: (id: number) => currenciesApi.setDefault(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: currencyKeys.all }); toast.success(t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
  const [editing, setEditing] = useState<Currency | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<Currency | null>(null)
  const open = (r: Currency | null) => { setEditing(r); setDialog(true) }

  const columns: Column<Currency>[] = [
    { id: "code", sortKey: "code", header: t("settings.lists.currencies.code"), cell: (r) => <span className="font-semibold" dir="ltr">{r.code}</span> },
    { id: "name", sortKey: "name", header: t("settings.lists.currencies.name"), cell: (r) => r.name },
    { id: "symbol", sortKey: "symbol", header: t("settings.lists.currencies.symbol"), cell: (r) => <span className="text-muted-foreground">{r.symbol}</span> },
    { id: "default", sortKey: "isDefault", header: "", cell: (r) => r.isDefault && <Badge>{t("settings.lists.currencies.default")}</Badge> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && (
      <div className="flex justify-end gap-1">
        {!r.isDefault && <Button size="sm" variant="outline" disabled={makeDefault.isPending} onClick={() => makeDefault.mutate(r.id)}><Star />{t("settings.lists.currencies.setDefault")}</Button>}
        <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} />
      </div>
    ) },
  ]
  return (
    <SectionCard title={t("settings.s.currencies")} description={t("settings.sd.currencies")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{t("settings.lists.currencies.add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(r) => r.id} searchText={(r) => `${r.code} ${r.name}`} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={t("settings.lists.currencies.empty")} />} />
      <CurrencyDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("settings.lists.currencies.deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
