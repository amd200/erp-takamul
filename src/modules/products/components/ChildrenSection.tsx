import { useFieldArray, useFormContext, useFormState } from "react-hook-form"
import { enteredPrice } from "../pricing"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import type { ProductForm } from "../schema"
import { ProductSearchPicker } from "./ProductSearchPicker"

/**
 * A branched item groups existing items (sizes, flavours), as in the current system: one box that holds the chosen
 * items as chips, and a search list to add more. Each keeps its own barcode and price.
 */
export function ChildrenSection({ selfId }: { selfId?: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { errors } = useFormState({ control, name: "children" })
  const rows = useFieldArray({ control, name: "children", keyName: "_key" })
  const rootError = errors.children?.message ?? errors.children?.root?.message
  const chosen = new Set(rows.fields.map((f) => f.id))

  return (
    <Field data-invalid={!!rootError}>
      <FieldLabel>{t("productForm.children")}<span className="text-red-500">*</span></FieldLabel>
      <ProductSearchPicker align="start" accept={(p) => (p.productType === "Direct" || p.productType === "Prepared") && p.id !== selfId && !chosen.has(p.id)}
        onPick={(p) => rows.append({ id: p.id, productNameAr: p.productNameAr, barcode: p.barcode ?? "", sellingPrice: enteredPrice(p) }, { shouldFocus: false })}>
        <div role="combobox" aria-expanded={false} tabIndex={0}
          className={cn("flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm", rootError && "border-destructive")}>
          {rows.fields.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-sm">
              {c.productNameAr}
              <button type="button" aria-label={t("common.remove")} className="text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); rows.remove(i) }}><X size={12} /></button>
            </span>
          ))}
          <span className="text-muted-foreground">{t("productForm.childrenSearch")}</span>
        </div>
      </ProductSearchPicker>
      {rootError && <p className="text-sm text-destructive">{t(rootError)}</p>}
    </Field>
  )
}
