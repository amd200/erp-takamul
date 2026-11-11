import { useState, useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { FlaskConical, X } from "lucide-react"
import { router } from "@/app/router"
import { Switch } from "@/components/ui/switch"
import { useSimLog, useSimStore, type SimKey } from "./posSim"

const KEYS: SimKey[] = ["failBefore", "dropAfter", "http500", "slow"]

/** Test-only floating window over the cashier screens: switches that break the next sale request on purpose. */
export function PosSimPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const path = useSyncExternalStore(router.subscribe, () => router.state.location.pathname)
  const sim = useSimStore()
  const { log, clear } = useSimLog()
  if (!/^\/pos(?!4)/.test(path)) return null
  const active = KEYS.some((k) => sim[k].on)

  return (
    <div dir={t("posSim.dir")} className="fixed bottom-3 start-3 z-[200] text-sm">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} title={t("posSim.title")}
          className={`flex size-10 items-center justify-center rounded-full border shadow-lg ${active ? "border-amber-500 bg-amber-500 text-white" : "bg-card text-foreground"}`}>
          <FlaskConical className="size-5" />
        </button>
      ) : (
        <div className="w-80 rounded-lg border bg-card p-3 text-card-foreground shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <b>{t("posSim.title")}</b>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")}><X className="size-4" /></button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{t("posSim.hint")}</p>
          <div className="space-y-2">
            {KEYS.map((k) => (
              <div key={k} className="rounded border p-2">
                <label className="flex items-center justify-between gap-2">
                  <span>{t(`posSim.${k}`)}</span>
                  <Switch checked={sim[k].on} onCheckedChange={(on) => sim.set(k, { on })} />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">{t(`posSim.${k}Hint`)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={sim[k].once} onChange={(e) => sim.set(k, { once: e.target.checked })} />
                    {t("posSim.once")}
                  </label>
                  {k === "slow" && (
                    <>
                      <label className="flex items-center gap-1">
                        <input type="number" onWheel={(e) => e.currentTarget.blur()} min={1} max={120} value={sim.slowSeconds} onChange={(e) => sim.setSlow({ slowSeconds: Math.max(1, Number(e.target.value) || 1) })} className="w-14 rounded border bg-background px-1" />
                        {t("posSim.seconds")}
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={sim.slowTimeout} onChange={(e) => sim.setSlow({ slowTimeout: e.target.checked })} />
                        {t("posSim.endTimeout")}
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <b className="text-xs">{t("posSim.log")}</b>
            <span className="flex gap-3 text-xs">
              <button type="button" className="underline" onClick={clear}>{t("posSim.clearLog")}</button>
              <button type="button" className="underline" onClick={sim.reset}>{t("posSim.reset")}</button>
            </span>
          </div>
          <pre dir="ltr" className="mt-1 max-h-28 overflow-auto rounded bg-muted p-1 text-[11px] leading-4">{log.length ? log.join("\n") : "-"}</pre>
        </div>
      )}
    </div>
  )
}
