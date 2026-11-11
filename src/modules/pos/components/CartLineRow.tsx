import { memo } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CategoryDiscountBadge } from "@/modules/sales/components/CategoryDiscountBadge"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { lineAmounts } from "@/modules/sales/totals"
import type { CartLine } from "../types"

/** The columns of the cart table; the header row in the cart uses the same ones. */
export const CART_GRID = "grid grid-cols-[18px_minmax(64px,1fr)_72px_50px_60px_32px] gap-1 px-2"

type Props = {
  line: CartLine
  index: number
  locked: boolean
  onQty: (key: string, q: number) => void
  onRemove: (key: string) => void
  onEdit: (key: string) => void
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation()

/**
 * One row of the cart table, like the current POS: number, item, quantity, unit price, total and delete.
 * Pressing the row opens the item editor.
 */
export const CartLineRow = memo(function CartLineRow({ line: l, index, locked, onQty, onRemove, onEdit }: Props) {
  const { t } = useTranslation()
  const total = lineAmounts(l).total
  // The unit price shown is what is actually charged: after the line's discount and tax.
  const unit = l.quantity > 0 ? total / l.quantity : 0
  const edit = () => { if (!locked) onEdit(l.key) }

  return (
    <li role="button" tabIndex={0} aria-label={`${l.name}: ${t("pos.lineOptions")}`} onClick={edit} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); edit() } }}
      className={cn(CART_GRID, "cursor-pointer items-center border-b border-border py-2 text-start outline-none transition-colors odd:bg-card even:bg-muted/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", locked && "cursor-default")}>
      <span className="text-xs font-medium text-faint tabular-nums">{index + 1}</span>

      <div className="min-w-0">
        <div className="text-xs leading-snug font-bold">{l.name}</div>
        {l.extras.length > 0 && <div className="text-[10px] text-gray-400">+ {l.extras.map((e) => e.name).join("، ")}</div>}
        {l.categoryDiscount && <CategoryDiscountBadge line={l} className="mt-0.5" />}
        {!l.categoryDiscount && l.discount > 0 && <div className="text-[10px] font-semibold text-primary">{l.discountKind === "percent" ? `${l.discount}% ${t("pos.off")}` : `-${formatMoney(l.discount)}`}</div>}
              </div>

      <div className="flex items-center justify-center gap-1" onClick={stop} onKeyDown={stop}>
        <button type="button" aria-label={t("pos.less")} disabled={locked} onClick={() => onQty(l.key, l.quantity - 1)}
          className="flex size-4 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><Minus size={11} /></button>
        <input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="any" value={l.quantity} readOnly={locked} aria-label={t("products.quantity")}
          onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onQty(l.key, v) }}
          className="h-6 w-7 [appearance:textfield] rounded border bg-card text-center text-xs font-semibold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" aria-label={t("pos.more")} disabled={locked} onClick={() => onQty(l.key, l.quantity + 1)}
          className="flex size-4 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"><Plus size={11} /></button>
      </div>

      <span className="text-center text-xs font-semibold text-gray-700 tabular-nums dark:text-foreground">{formatMoney(unit)}</span>
      <span className="text-center text-xs font-bold tabular-nums">{formatMoney(total)}</span>

      <div className="flex justify-center" onClick={stop} onKeyDown={stop}>
        <button type="button" aria-label={t("common.remove")} disabled={locked} onClick={() => onRemove(l.key)}
          className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="size-3.5" /></button>
      </div>
    </li>
  )
})
