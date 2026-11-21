import { useCallback, useEffect, useState } from "react"
import { Download, FileText, Loader2, Maximize, Printer, Receipt, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PAPERS, printDocument, renderDocument, type PrintDoc } from "@/shared/print"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import type { SalesOrderDto } from "../types"

type Paper = "a4" | "roll"

/** Preview only: the page is as tall as its content (the A4 templates force a full-sheet height for printing). */
const FIT = "<style>html,body,.invoice-page{min-height:0!important;height:auto!important}</style>"

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const PAD = 24

/** On-screen preview of an invoice with the same template the print uses (the A4 design chosen in settings, or the receipt roll). */
export function InvoicePreviewDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const output = useInvoiceOutput()
  const pdf = useInvoiceOutput()
  const [paper, setPaper] = useState<Paper>("a4")
  const [doc, setDoc] = useState<PrintDoc | null>(null)
  const [height, setHeight] = useState(400)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const id = invoice?.id

  /** Track the preview area so the page can be scaled to its width. */
  const setBoxEl = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (id === undefined) { setDoc(null); return }
    let live = true
    setDoc(null)
    setZoom(1)
    output.mutateAsync({ invoice: { id }, as: "preview", paper }).then((d) => { if (live && d) setDoc(d) }).catch(() => {})
    return () => { live = false }
  }, [id, paper])

  const pageW = doc ? PAPERS[doc.paper].px : 0
  // "Fit" = the page fills the width of the area (never enlarged past 1.5x for the narrow roll); the zoom buttons work on top of it.
  const fit = pageW && box.w ? Math.min((box.w - PAD * 2) / pageW, paper === "roll" ? 1.5 : 1) : 1
  const scale = fit * zoom
  const stepZoom = (dir: 1 | -1) => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, ZOOMS.findIndex((v) => v >= z - 1e-6) + dir))])

  const title = t("sales.previewTitle", { number: invoice?.orderNumber })

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 flex-row items-center gap-3 border-b px-4 py-3 pe-12">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText size={18} /></span>
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <DialogDescription className="mt-1 truncate text-xs">{invoice?.customerName || t("sales.previewHint")}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-card px-4 py-2">
          <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label={t("sales.previewPaper")}>
            {([["a4", FileText, t("sales.previewA4")], ["roll", Receipt, t("sales.previewRoll")]] as const).map(([p, Icon, label]) => (
              <button
                key={p}
                type="button"
                aria-pressed={paper === p}
                onClick={() => setPaper(p)}
                className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                  paper === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              ><Icon size={14} />{label}</button>
            ))}
          </div>

          <div className="ms-auto flex items-center gap-1" dir="ltr">
            <Button variant="ghost" size="icon-sm" disabled={!doc || zoom <= ZOOMS[0]} onClick={() => stepZoom(-1)} aria-label={t("sales.previewZoomOut")} title={t("sales.previewZoomOut")}><ZoomOut size={16} /></Button>
            <button type="button" disabled={!doc} onClick={() => setZoom(1)} title={t("sales.previewFit")}
              className="inline-flex h-7 min-w-12 items-center justify-center gap-1 rounded-md px-1.5 text-xs font-medium tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
              {zoom === 1 ? <Maximize size={13} /> : null}{Math.round(scale * 100)}%
            </button>
            <Button variant="ghost" size="icon-sm" disabled={!doc || zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => stepZoom(1)} aria-label={t("sales.previewZoomIn")} title={t("sales.previewZoomIn")}><ZoomIn size={16} /></Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!doc || pdf.isPending} onClick={() => id !== undefined && pdf.mutate({ invoice: { id }, as: "pdf", paper })}>
              {pdf.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}<span className="hidden sm:inline">{t("sales.actions.downloadPdf")}</span>
            </Button>
            <Button size="sm" disabled={!doc} onClick={() => doc && printDocument(doc)}><Printer size={14} /><span className="hidden sm:inline">{t("sales.actions.print")}</span></Button>
          </div>
        </div>

        <div ref={setBoxEl} className="min-h-0 flex-1 overflow-auto bg-muted/60 dark:bg-muted/30" style={{ padding: PAD }}>
          {doc ? (
            <div dir="ltr" className="mx-auto overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black/5" style={{ position: "relative", width: pageW * scale, height: height * scale }}>
              <iframe
                title={title}
                srcDoc={renderDocument(doc).replace("</head>", `${FIT}</head>`)}
                scrolling="no"
                onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) { setHeight(d.documentElement.offsetHeight); void d.fonts.ready.then(() => setHeight(d.documentElement.offsetHeight)) } }}
                style={{ width: pageW, height, border: 0, background: "#fff", display: "block", position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={28} />
              {t("sales.previewLoading")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
