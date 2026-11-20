import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Puzzle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput } from "@/components/form/FormFields"
import { MultiPicker } from "@/components/form/MultiPicker"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useCategories } from "@/modules/categories/queries"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { additionSchema, emptyAddition, type AdditionForm } from "../schema"
import { useAdditions, useDeleteAddition, useSaveAddition } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { Addition } from "../types"

function AdditionDialog({ open, onOpenChange, addition }: { open: boolean; onOpenChange: (o: boolean) => void; addition: Addition | null }) {
  const { t } = useTranslation()
  const save = useSaveAddition()
  const formBranch = useFormBranch(open && !addition)
  const { data: categories = [] } = useCategories()
  const form = useForm<AdditionForm>({ resolver: zodResolver(additionSchema), defaultValues: emptyAddition })
  useEffect(() => { if (open) form.reset(addition ? { nameAr: addition.additionNameAr, nameEn: addition.additionNameEn ?? "", nameUr: addition.additionNameUr ?? "", categoryIds: addition.categoryIds } : emptyAddition) }, [open, addition, form])
  // The categories belong to the branch, so the ones picked from the old branch are cleared.
  const changeBranch = async (next: number) => {
    await formBranch.pick(next)
    form.setValue("categoryIds", [])
  }
  const submit = form.handleSubmit((data) => save.mutate({ id: addition?.id, data }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader><DialogTitle>{addition ? t("additions.edit") : t("additions.add")}</DialogTitle></DialogHeader>
        <DialogBody>
          <form id="addition-form" onSubmit={submit}>
            <FieldGroup className="gap-3">
              {formBranch.show && <BranchSection value={formBranch.branchId} onChange={changeBranch} />}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormInput control={form.control} name="nameAr" label={t("additions.nameAr")} required />
                <FormInput control={form.control} name="nameEn" label={t("additions.nameEn")} dir="ltr" />
                <FormInput control={form.control} name="nameUr" label={t("additions.nameUr")} dir="ltr" />
              </div>
              <Controller control={form.control} name="categoryIds" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("additions.showWith")}<span className="text-destructive">*</span></FieldLabel>
                  <MultiPicker options={categories.map((c) => ({ value: c.id, label: c.categoryNameAr }))} value={field.value} onChange={field.onChange} listClassName="max-h-32" />
                  <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message!) }] : undefined} />
                </Field>
              )} />
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="addition-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdditionsPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data = [], isLoading } = useAdditions(sortBy ? { SortBy: sortBy, SortDescending: sortDescending } : undefined)
  const del = useDeleteAddition()
  const [editing, setEditing] = useState<Addition | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Addition | null>(null)
  const open = (a: Addition | null) => { setEditing(a); setDialogOpen(true) }

  const columns: Column<Addition>[] = [
    { id: "name", sortKey: "additionNameAr", header: t("additions.name"), cell: (a) => <span className="font-semibold">{a.additionNameAr}</span> },
    { id: "actions", header: "", align: "end", cell: (a) => can(P.additions.manage) && <RowActions onEdit={() => open(a)} onDelete={() => setToDelete(a)} /> },
  ]

  return (
    <>
      <PageHeader title={t("additions.title")} description={t("additions.description")}
        actions={<Can perm={P.additions.manage}><Button size="lg" onClick={() => open(null)}><Plus />{t("additions.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(a) => a.id} sort={sort} searchPlaceholder={t("additions.search")}
            empty={<EmptyState icon={<Puzzle />} title={t("additions.empty")} hint={t("additions.emptyHint")} />} />
        </SectionCard>
      <AdditionDialog open={dialogOpen} onOpenChange={setDialogOpen} addition={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("additions.deleteTitle")} description={t("additions.deleteBody", { name: toDelete?.additionNameAr })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
