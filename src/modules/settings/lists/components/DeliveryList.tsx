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
import { useDelivery, useDeleteDelivery, useSaveDelivery } from "../queries"
import { deliverySchema } from "../schema"
import type { DeliveryCompany } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { name: string }
const empty: Form = { name: "" }

function CompanyDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: DeliveryCompany | null }) {
  const { t } = useTranslation()
  const save = useSaveDelivery()
  const form = useForm<Form>({ resolver: zodResolver(deliverySchema), defaultValues: empty })
  useEffect(() => { if (open) form.reset(item ?? empty) }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data }, { onSuccess: () => onOpenChange(false) }))
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t(`settings.lists.delivery_companies.${item ? "edit" : "add"}`)} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="name" label={t("settings.lists.delivery_companies.name")} required />
    </FormDialog>
  )
}

export function DeliveryList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading } = useDelivery()
  const del = useDeleteDelivery()
  const [editing, setEditing] = useState<DeliveryCompany | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<DeliveryCompany | null>(null)
  const open = (c: DeliveryCompany | null) => { setEditing(c); setDialog(true) }

  const columns: Column<DeliveryCompany>[] = [
    { id: "name", header: t("settings.lists.delivery_companies.name"), cell: (c) => <span className="font-semibold">{c.name}</span> },
    { id: "actions", header: "", align: "end", cell: (c) => !readOnly && <RowActions onEdit={() => open(c)} onDelete={() => setToDelete(c)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.delivery_companies")} description={t("settings.sd.delivery_companies")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{t("settings.lists.delivery_companies.add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} rowKey={(c) => c.id} searchText={(c) => c.name} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={t("settings.lists.delivery_companies.empty")} />} />
      <CompanyDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("settings.lists.delivery_companies.deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
