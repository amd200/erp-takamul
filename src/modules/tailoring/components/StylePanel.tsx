import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useTailoringStore } from "../store"
import { STYLE_OPTIONS, type StyleKey } from "../types"
import { GarmentIcon } from "./GarmentIcon"

/** How the selected piece is cut: collar, sleeve end, pockets, front placket, and a free note for the tailor. */
export function StylePanel() {
  const { t } = useTranslation()
  const pieces = useTailoringStore((s) => s.pieces)
  const activeKey = useTailoringStore((s) => s.activeKey)
  const setActive = useTailoringStore((s) => s.setActive)
  const updatePiece = useTailoringStore((s) => s.updatePiece)
  const piece = pieces.find((p) => p.key === activeKey)

  if (!piece) return <p className="rounded-lg bg-card border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">{t("tailoring.style.noPiece")}</p>

  return (
    <div className="space-y-4">
      {pieces.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {pieces.map((p, i) => (
            <button key={p.key} type="button" onClick={() => setActive(p.key)}
              className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all", p.key === activeKey ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted")}>
              <GarmentIcon id={p.garment} className="size-3.5" />{t(`tailoring.garments.${p.garment}`)}<span className="tabular-nums opacity-70">#{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-2.5 lg:grid-cols-2">
        {(Object.keys(STYLE_OPTIONS) as StyleKey[]).map((k) => (
          <section key={k} className="rounded-xl border bg-card">
            <h3 className="border-b px-3 py-2 text-xs font-bold">{t(`tailoring.style.${k}`)}</h3>
            <div className="grid grid-cols-2 gap-1.5 p-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {STYLE_OPTIONS[k].map((o) => {
                const on = piece.style[k] === o
                return (
                  <button key={o} type="button" aria-pressed={on} onClick={() => updatePiece(piece.key, { style: { ...piece.style, [k]: o } })}
                    className={cn("h-9 rounded-lg border text-xs font-semibold transition-all", on ? "border-primary bg-primary/10 text-primary ring-1 ring-primary ring-inset" : "border-border bg-background text-muted-foreground hover:border-primary/40")}>
                    {t(`tailoring.style.options.${o}`)}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border bg-card">
        <h3 className="border-b px-3 py-2 text-xs font-bold">{t("tailoring.style.note")}</h3>
        <div className="p-2.5">
          <textarea value={piece.note} onChange={(e) => updatePiece(piece.key, { note: e.target.value })} placeholder={t("tailoring.style.notePh")} rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary/40" />
        </div>
      </section>
    </div>
  )
}
