import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Inbox, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { useDeletePricing, usePricing, useSavePricing } from "../queries"
import { pricingSchema } from "../schema"
import type { PricingSystem } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { nameAr: string; systemType: PricingSystem["systemType"]; adjustmentType: PricingSystem["adjustmentType"]; value: number | undefined }
const empty: Form = { nameAr: "", systemType: "Local", adjustmentType: "Percentage", value: undefined }

function PricingDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: PricingSystem | null }) {
  const { t } = useTranslation()
  const save = useSavePricing()
  const form = useForm<Form>({ resolver: zodResolver(pricingSchema) as never, defaultValues: empty })
  useEffect(() => {
    if (open) form.reset(item ? { nameAr: item.nameAr, systemType: item.systemType, adjustmentType: item.adjustmentType, value: item.value } : empty)
  }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data: data as Omit<PricingSystem, "id"> }, { onSuccess: () => onOpenChange(false) }))
  const label = (k: string) => t(`settings.lists.pricing_systems.${k}`)
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={label(item ? "edit" : "add")} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="nameAr" label={label("nameAr")} required />
      <FormSelect control={form.control} name="systemType" label={label("systemType")} required
        options={(["Local", "Delivery"] as const).map((v) => ({ value: v, label: label(`o.systemType.${v}`) }))} />
      <FormSelect control={form.control} name="adjustmentType" label={label("adjustmentType")} required
        options={(["Percentage", "Value"] as const).map((v) => ({ value: v, label: label(`o.adjustmentType.${v}`) }))} />
      <FormInput control={form.control} name="value" type="number" label={label("value")} required />
    </FormDialog>
  )
}

export function PricingList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading } = usePricing()
  const del = useDeletePricing()
  const [editing, setEditing] = useState<PricingSystem | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<PricingSystem | null>(null)
  const open = (r: PricingSystem | null) => { setEditing(r); setDialog(true) }
  const label = (k: string) => t(`settings.lists.pricing_systems.${k}`)

  const columns: Column<PricingSystem>[] = [
    { id: "name", header: label("nameAr"), cell: (r) => <span className="font-semibold">{r.nameAr}</span> },
    { id: "type", header: label("systemType"), cell: (r) => <span className="text-muted-foreground">{label(`o.systemType.${r.systemType}`)}</span> },
    { id: "adjustment", header: label("adjustmentType"), cell: (r) => <span className="text-muted-foreground">{label(`o.adjustmentType.${r.adjustmentType}`)}</span> },
    { id: "value", header: label("value"), cell: (r) => <span className="tabular-nums">{r.value}{r.adjustmentType === "Percentage" ? "%" : ""}</span> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.pricing_systems")} description={t("settings.sd.pricing_systems")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{label("add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} rowKey={(r) => r.id} searchText={(r) => r.nameAr} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={label("empty")} />} />
      <PricingDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={label("deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.nameAr })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
