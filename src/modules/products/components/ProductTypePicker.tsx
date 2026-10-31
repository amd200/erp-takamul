import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { PRODUCT_TYPES, type ProductType } from "../types"

/** The four item kinds as one segmented control, the selected one white with brand-coloured text, as in the current system. */
export function ProductTypePicker({ value, onChange, locked }: { value: ProductType; onChange: (t: ProductType) => void; locked?: boolean }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t("products.type")} className="inline-flex h-11 w-full items-center rounded-lg bg-muted p-[3px]">
      {PRODUCT_TYPES.map((type) => {
        const selected = value === type
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked && !selected}
            onClick={() => onChange(type)}
            className={cn(
              "flex h-full flex-1 items-center justify-center rounded-md px-1.5 text-sm font-medium whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "bg-background text-primary shadow-sm" : "text-foreground/60 hover:text-foreground",
            )}
          >
            {t(`productForm.types.${type}`)}
          </button>
        )
      })}
    </div>
  )
}
