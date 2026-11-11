import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { categorySchema, categoryFormValues, emptyCategory, type CategoryForm } from "../schema"
import { useSaveCategory } from "../queries"
import { usePrinterOptions } from "@/shared/printers/usePrinters"
import type { Category } from "../types"

export function CategoryDialog({ open, onOpenChange, category }: { open: boolean; onOpenChange: (o: boolean) => void; category: Category | null }) {
  const { t } = useTranslation()
  const save = useSaveCategory()
  const formBranch = useFormBranch(open && !category)
  const form = useForm<CategoryForm>({ resolver: zodResolver(categorySchema), defaultValues: emptyCategory })
  const printers = usePrinterOptions(form.watch("printerName"))

  useEffect(() => {
    if (open) form.reset(category ? categoryFormValues(category) : emptyCategory)
  }, [open, category, form])

  const submit = form.handleSubmit((data) => save.mutate({ id: category?.id, data: { ...data, printerName: data.printerName?.trim() || null } }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader><DialogTitle>{category ? t("categories.edit") : t("categories.add")}</DialogTitle></DialogHeader>
        <DialogBody>
          <form onSubmit={submit} id="category-form" noValidate>
            <FieldGroup className="gap-4">
              {formBranch.show && <BranchSection value={formBranch.branchId} onChange={formBranch.pick} />}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormInput control={form.control} name="categoryNameAr" label={t("categories.nameAr")} required />
                <FormInput control={form.control} name="categoryNameEn" label={t("categories.nameEn")} dir="ltr" />
                <FormInput control={form.control} name="categoryNameUr" label={t("categories.nameUr")} dir="ltr" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormInput control={form.control} name="displayOrder" type="number" label={t("common.displayOrder")} />
                <FormInput control={form.control} name="description" label={t("common.description")} placeholder={t("common.optional")} />
              </div>
              {/* The server keeps printers per item; this sets it on every item already in the category. */}
              {category && (
                <FormSelect control={form.control} name="printerName" label={t("categories.printerForItems")} allowEmpty={t("productForm.noPrinter")} options={printers} />
              )}
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="category-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
