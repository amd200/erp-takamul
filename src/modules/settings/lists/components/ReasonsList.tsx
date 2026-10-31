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
import { useTaxes } from "@/modules/taxes/service"
import { useDeleteReason, useReasons, useSaveReason } from "../queries"
import { reasonSchema } from "../schema"
import type { ExemptionReason } from "../types"
import { FormDialog } from "./FormDialog"

type Form = { taxExemptionReasonCode: string; taxExemptionReasonText: string; taxId: number | undefined }
const empty: Form = { taxExemptionReasonCode: "", taxExemptionReasonText: "", taxId: undefined }

function ReasonDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: ExemptionReason | null }) {
  const { t } = useTranslation()
  const save = useSaveReason()
  const { data: taxes = [] } = useTaxes()
  const form = useForm<Form>({ resolver: zodResolver(reasonSchema) as never, defaultValues: empty })
  useEffect(() => {
    if (open) form.reset(item ? { taxExemptionReasonCode: item.taxExemptionReasonCode, taxExemptionReasonText: item.taxExemptionReasonText, taxId: item.taxId } : empty)
  }, [open, item, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: item?.id, data: data as Omit<ExemptionReason, "id" | "isActive"> }, { onSuccess: () => onOpenChange(false) }))
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t(`settings.lists.tax_exemption_reasons.${item ? "edit" : "add"}`)} onSubmit={submit} pending={save.isPending}>
      <FormInput control={form.control} name="taxExemptionReasonCode" label={t("settings.lists.tax_exemption_reasons.taxExemptionReasonCode")} dir="ltr" required />
      <FormInput control={form.control} name="taxExemptionReasonText" label={t("settings.lists.tax_exemption_reasons.taxExemptionReasonText")} required />
      <FormSelect control={form.control} name="taxId" label={t("settings.lists.tax_exemption_reasons.taxId")} required numeric placeholder={t("settings.choose")}
        options={taxes.map((x) => ({ value: String(x.id), label: x.name }))} />
    </FormDialog>
  )
}

export function ReasonsList({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading } = useReasons()
  const { data: taxes = [] } = useTaxes()
  const del = useDeleteReason()
  const [editing, setEditing] = useState<ExemptionReason | null>(null)
  const [dialog, setDialog] = useState(false)
  const [toDelete, setToDelete] = useState<ExemptionReason | null>(null)
  const open = (r: ExemptionReason | null) => { setEditing(r); setDialog(true) }
  const taxName = (id: number) => taxes.find((x) => x.id === id)?.name ?? "—"

  const columns: Column<ExemptionReason>[] = [
    { id: "code", header: t("settings.lists.tax_exemption_reasons.taxExemptionReasonCode"), cell: (r) => <span className="font-semibold" dir="ltr">{r.taxExemptionReasonCode}</span> },
    { id: "text", header: t("settings.lists.tax_exemption_reasons.taxExemptionReasonText"), cell: (r) => r.taxExemptionReasonText },
    { id: "tax", header: t("settings.lists.tax_exemption_reasons.taxId"), cell: (r) => <span className="text-muted-foreground">{taxName(r.taxId)}</span> },
    { id: "actions", header: "", align: "end", cell: (r) => !readOnly && <RowActions onEdit={() => open(r)} onDelete={() => setToDelete(r)} /> },
  ]
  return (
    <SectionCard title={t("settings.s.tax_exemption_reasons")} description={t("settings.sd.tax_exemption_reasons")}
      action={!readOnly && <Button onClick={() => open(null)}><Plus />{t("settings.lists.tax_exemption_reasons.add")}</Button>}>
      <DataTable rows={data ?? []} loading={isLoading} columns={columns} rowKey={(r) => r.id}
        searchText={(r) => `${r.taxExemptionReasonCode} ${r.taxExemptionReasonText}`} searchPlaceholder={t("settings.lists.search")}
        empty={<EmptyState icon={<Inbox />} title={t("settings.lists.tax_exemption_reasons.empty")} />} />
      <ReasonDialog open={dialog} onOpenChange={setDialog} item={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("settings.lists.tax_exemption_reasons.deleteTitle")} description={t("settings.lists.deleteBody", { name: toDelete?.taxExemptionReasonText })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </SectionCard>
  )
}
