import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Ruler } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { emptyUnit, unitSchema, type UnitForm } from "../schema"
import { useDeleteUnit, useSaveUnit, useUnits } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { Unit } from "../types"

function UnitDialog({ open, onOpenChange, unit }: { open: boolean; onOpenChange: (o: boolean) => void; unit: Unit | null }) {
  const { t } = useTranslation()
  const save = useSaveUnit()
  const form = useForm<UnitForm>({ resolver: zodResolver(unitSchema), defaultValues: emptyUnit })
  useEffect(() => { if (open) form.reset(unit ? { name: unit.name, taxCode: unit.taxCode ?? "", description: unit.description ?? "" } : emptyUnit) }, [open, unit, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: unit?.id, data }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{unit ? t("units.edit") : t("units.add")}</DialogTitle></DialogHeader>
        <form id="unit-form" onSubmit={submit}>
          <FieldGroup className="gap-4">
            <FormInput control={form.control} name="name" label={t("units.name")} required />
            <FormInput control={form.control} name="taxCode" label={t("units.taxCode")} dir="ltr" />
            <FormInput control={form.control} name="description" label={t("common.description")} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="unit-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UnitsPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { data, isLoading } = useUnits()
  const del = useDeleteUnit()
  const [editing, setEditing] = useState<Unit | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Unit | null>(null)
  const open = (u: Unit | null) => { setEditing(u); setDialogOpen(true) }

  const columns: Column<Unit>[] = [
    { id: "name", header: t("units.name"), cell: (u) => <span className="font-semibold">{u.name}</span> },
    { id: "code", header: t("units.taxCode"), cell: (u) => <span className="text-muted-foreground" dir="ltr">{u.taxCode || "—"}</span> },
    { id: "desc", header: t("common.description"), cell: (u) => <span className="text-muted-foreground">{u.description || "—"}</span> },
    { id: "actions", header: "", align: "end", cell: (u) => can(P.units.manage) && <RowActions onEdit={() => open(u)} onDelete={() => setToDelete(u)} /> },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.items")]} title={t("units.title")} description={t("units.description")}
        actions={<Can perm={P.units.manage}><Button size="lg" onClick={() => open(null)}><Plus />{t("units.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(u) => u.id}
            searchText={(u) => `${u.name} ${u.taxCode}`} searchPlaceholder={t("units.search")}
            empty={<EmptyState icon={<Ruler />} title={t("units.empty")} hint={t("units.emptyHint")} />} />
        </SectionCard>
      <UnitDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("units.deleteTitle")} description={t("units.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
