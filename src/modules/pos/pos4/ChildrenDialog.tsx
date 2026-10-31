import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Product } from "@/modules/products/types"

type Child = NonNullable<Product["children"]>[number]

/**
 * The items a branched item groups. The window stays open so several can be added in a row; each one shows a tick
 * and how many are in the cart, and Cancel closes it.
 */
export function ChildrenDialog({ parent, nameOf, priceOf, quantityOf, nameFont, priceFont, onClose, onPick }: {
  parent: Product | null
  nameOf: (c: Pick<Product, "productNameAr" | "productNameEn">) => string
  priceOf: (c: Child) => number
  quantityOf: (id: number) => number
  nameFont: number
  priceFont: number
  onClose: () => void
  onPick: (c: Child) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog modal={false} open={!!parent} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="h-fit w-full max-w-none gap-0 rounded-2xl border-border bg-background p-0 text-foreground sm:w-max sm:max-w-none sm:min-w-[380px]">
        <DialogHeader className="border-b border-border px-5 pt-5 pb-3">
          <DialogTitle className="text-sm font-black">{parent ? nameOf(parent) : ""}</DialogTitle>
          <DialogDescription className="sr-only">{t("pos.chooseHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex h-fit w-full flex-col gap-2 px-4 py-3">
          {(parent?.children ?? []).map((c) => {
            const qty = quantityOf(c.id)
            return (
              <button key={c.id} type="button" onClick={() => onPick(c)}
                className={cn("relative flex w-full items-center justify-between gap-4 rounded-xl border px-3 py-2.5 transition-all duration-150 active:scale-[0.98]",
                  qty > 0 ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:border-primary/50 hover:bg-primary/5")}>
                <span className="flex min-w-0 items-center gap-2 font-semibold whitespace-nowrap text-foreground" style={{ fontSize: nameFont }}>
                  {qty > 0 && <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={11} strokeWidth={3} /></span>}
                  {nameOf(c)}
                  {qty > 0 && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">×{qty}</span>}
                </span>
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary tabular-nums" style={{ fontSize: priceFont }}>{priceOf(c).toFixed(2)}</span>
              </button>
            )
          })}
        </div>
        <div className="px-4 pt-2 pb-4">
          <button type="button" onClick={onClose} className="w-full rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{t("common.cancel")}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
