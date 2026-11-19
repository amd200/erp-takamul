import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PRODUCTS } from "../data"
import { useTailoringStore } from "../store"
import { STYLE_OPTIONS, type StyleKey, type TailorPiece } from "../types"

const TABS = ["fabric", "style", "note"] as const
type Tab = (typeof TABS)[number]

/**
 * Opens on a piece's row in the cart, like the sales screen's item window: the fabric and colour typed in, the cut details
 * (collar, sleeve, pockets, placket) and a note for the tailor. Nothing changes until "done".
 */
export function PieceEditor({ pieceKey, onClose }: { pieceKey: string | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const piece = useTailoringStore((s) => s.pieces.find((p) => p.key === pieceKey) ?? null)
  const updatePiece = useTailoringStore((s) => s.updatePiece)
  const [tab, setTab] = useState<Tab>("fabric")
  const [draft, setDraft] = useState<TailorPiece | null>(null)
  useEffect(() => { if (pieceKey) { setDraft(useTailoringStore.getState().pieces.find((p) => p.key === pieceKey) ?? null); setTab("fabric") } }, [pieceKey])
  const product = PRODUCTS.find((p) => p.id === piece?.productId)
  const field = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"

  const done = () => { if (draft) updatePiece(draft.key, { fabric: draft.fabric, color: draft.color, style: draft.style, note: draft.note }); onClose() }

  return (
    <Dialog open={!!pieceKey && !!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="truncate text-start text-sm font-semibold text-foreground/80">{product ? (i18n.language === "ar" ? product.name : product.nameEn) : ""}</DialogTitle>
          <DialogDescription className="sr-only">{t("tailoring.steps.style")}</DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex border-b border-border">
          {TABS.map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={cn("relative -mb-px flex-1 border-b-2 py-3 text-[13px] font-semibold transition-all duration-150", tab === k ? "border-primary bg-muted/50 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground")}>
              {t(`tailoring.editorTabs.${k}`)}
            </button>
          ))}
        </div>

        {draft && (
          <div className="max-h-[60dvh] overflow-y-auto border-b border-border bg-muted/50 px-4 py-3">
            {tab === "fabric" && (
              <div className="space-y-3">
                <label className="block space-y-1"><span className="text-xs text-muted-foreground">{t("tailoring.fabrics.fabric")}</span>
                  <input autoFocus value={draft.fabric} onChange={(e) => setDraft({ ...draft, fabric: e.target.value })} placeholder={t("tailoring.fabrics.fabricPh")} className={field} /></label>
                <label className="block space-y-1"><span className="text-xs text-muted-foreground">{t("tailoring.fabrics.color")}</span>
                  <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder={t("tailoring.fabrics.colorPh")} className={field} /></label>
              </div>
            )}
            {tab === "style" && (
              <div className="space-y-3">
                {(Object.keys(STYLE_OPTIONS) as StyleKey[]).map((k) => (
                  <div key={k}>
                    <p className="mb-1.5 text-xs text-muted-foreground">{t(`tailoring.style.${k}`)}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {STYLE_OPTIONS[k].map((o) => {
                        const on = draft.style[k] === o
                        return (
                          <button key={o} type="button" aria-pressed={on} onClick={() => setDraft({ ...draft, style: { ...draft.style, [k]: o } })}
                            className={cn("rounded-xl border px-1 py-2.5 text-[12px] leading-tight font-semibold transition-all duration-150 active:scale-95", on ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted/60")}>
                            {t(`tailoring.style.options.${o}`)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === "note" && (
              <textarea autoFocus value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={4} placeholder={t("tailoring.style.notePh")}
                className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-primary/40" />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-4">
          <Button type="button" variant="outline" className="h-12 flex-1 gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={done}>{t("pos1.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
