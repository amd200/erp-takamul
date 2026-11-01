import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { PRODUCT_TYPES, type ProductType } from "../../types"

export function ProductTypePicker({ value, onChange, locked }: { value: ProductType; onChange: (t: ProductType) => void; locked?: boolean }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t("products.type")} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              "rounded-xl border p-3.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "border-primary bg-secondary" : "border-border hover:border-faint",
            )}
          >
            <div className={cn("font-semibold", selected && "text-secondary-foreground")}>{t(`products.types.${type}`)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{t(`products.typeHints.${type}`)}</div>
          </button>
        )
      })}
    </div>
  )
}
