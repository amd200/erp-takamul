import { useFieldArray, useFormContext, useFormState } from "react-hook-form"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney } from "@/lib/format"
import type { ProductForm } from "../../schema"
import { ProductSearchPicker } from "../ProductSearchPicker"
import { RepeatRows } from "./RepeatRows"

/**
 * A branched item groups existing direct items (sizes, flavours). Each keeps its own barcode
 * and price; here they're only picked and listed.
 */
export function ChildrenSection({ selfId }: { selfId?: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { errors } = useFormState({ control, name: "children" })
  const rows = useFieldArray({ control, name: "children", keyName: "_key" })
  const rootError = errors.children?.message ?? errors.children?.root?.message
  const chosen = new Set(rows.fields.map((f) => f.id))

  return (
    <SectionCard
      title={t("products.sections.children")}
      description={t("products.childrenHint")}
      action={
        <ProductSearchPicker align="end" type="Direct" accept={(p) => p.id !== selfId && !chosen.has(p.id)}
          onPick={(p) => rows.append({ id: p.id, nameAr: p.productNameAr, barcode: p.barcode ?? "", sellingPrice: p.sellingPrice ?? 0 }, { shouldFocus: false })}>
          <Button type="button" variant="outline"><Plus />{t("products.addChild")}</Button>
        </ProductSearchPicker>
      }
    >
      <RepeatRows
        count={rows.fields.length}
        onRemove={rows.remove}
        empty={t("products.noChildren")}
        error={rootError ? t(rootError) : undefined}
        cols="grid-cols-[1.6fr_1.2fr_1fr_auto]"
        headers={[t("products.childName"), t("products.barcode"), t("products.sellingPrice")]}
        renderRow={(i) => {
          const c = rows.fields[i]
          return (
            <>
              <span className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">{c.nameAr}</span>
              <span className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm"><bdi>{c.barcode || "—"}</bdi></span>
              <span className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm tabular-nums">{formatMoney(c.sellingPrice)}</span>
            </>
          )
        }}
      />
    </SectionCard>
  )
}
