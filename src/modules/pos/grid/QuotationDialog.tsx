import { useState } from "react"
import { CheckCircle2, Loader2, Search, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useDebounced } from "@/modules/products/lookup"
import { quotesApi } from "@/modules/quotes/service"
import { useAppSettings } from "@/modules/settings"
import { useLoadQuotation } from "../useLoadQuotation"

/**
 * The current POS's "load quotation" window: as the number is typed, the quotation with exactly that number is found and
 * its customer and date shown (its total in the header); "load items" turns it into the sale on screen.
 */
export function QuotationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const [number, setNumber] = useState("")
  const typed = useDebounced(number.trim())
  const { data: found = null, isFetching } = useQuery({
    queryKey: ["quotations", "by-number", typed],
    queryFn: async () => (await quotesApi.page({ page: 1, pageSize: 20, searchTerm: typed })).items.find((x) => x.quotationNumber === typed) ?? null,
    enabled: open && typed !== "",
  })
  const settled = typed === number.trim() && !isFetching

  const close = (o: boolean) => {
    if (!o) setNumber("")
    onOpenChange(o)
  }
  const quotation = useLoadQuotation(() => close(false))

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!quotation.isLoading) close(o) }}>
        <DialogContent showCloseButton={false} className="max-w-md gap-0 border-border bg-background p-0 text-foreground">
          <div className={cn("flex items-center justify-between px-4 py-3 dark:bg-secondary", beauty ? "bg-primary text-primary-foreground" : "bg-[#000052] text-white")}>
            <DialogTitle className={cn("text-[14px] font-medium", beauty ? "text-primary-foreground!" : "text-white!")}>{t("pos2.loadQuotation")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos2.loadQuotationHint")}</DialogDescription>
            <div className="flex items-center gap-2">
              {found && <span className="rounded bg-white/15 px-2.5 py-1 text-[13px]">{t("pos1.total")}: {(found.grandTotal ?? 0).toFixed(2)} {t("pos1.sar")}</span>}
              <button type="button" aria-label={t("common.close")} disabled={quotation.isLoading} onClick={() => close(false)} className="flex size-7 items-center justify-center rounded bg-white/15 transition-colors hover:bg-white/25"><X size={14} /></button>
            </div>
          </div>
          <div className="flex flex-col gap-4 bg-background p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="pos2-quotation" className="text-[11px] text-muted-foreground">{t("pos2.quotationNumber")}</label>
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="pos2-quotation" className="bg-muted/50 ps-8 text-[12px] text-foreground focus:border-primary!" placeholder={t("pos2.typeQuotationNumber")} disabled={quotation.isLoading} value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
            </div>

            {number.trim() && settled && (found ? (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-[12px]">
                <div className="flex gap-1"><span className="text-muted-foreground">{t("sales.customer")}:</span><span className="font-semibold">{found.customerName}</span></div>
                <div className="flex gap-1"><span className="text-muted-foreground">{t("common.date")}:</span><span className="font-semibold">{found.quotationDate ? formatDay(found.quotationDate, i18n.language) : "—"}</span></div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-[12px] text-muted-foreground">{t("pos2.quotationNotFound")}</div>
            ))}

            <hr className="border-border/60" />

            <div className="flex gap-2">
              <Button variant="outline" size="lg" disabled={quotation.isLoading} onClick={() => close(false)} className={cn("h-10 flex-1", beauty ? "border-primary text-primary! hover:bg-primary/10" : "border-[#000052] text-[#000052]! hover:bg-[#000052]/10")}>{t("common.cancel")}</Button>
              <Button size="lg" disabled={!found || !settled || quotation.isLoading} onClick={() => found && quotation.load(found.id)} className={cn("h-10 flex-1 text-[12px]", beauty ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-[#000052] text-white hover:bg-blue-900")}>
                {quotation.isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}{t("pos2.loadItems")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {quotation.confirmation}
    </>
  )
}
