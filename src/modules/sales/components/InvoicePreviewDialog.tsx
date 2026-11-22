import { useCallback, useEffect, useState } from "react"
import { Download, Loader2, Printer } from "lucide-react"
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

const PAD = 0
const KEY = "invoice-preview-paper"

const readPaper = (): Paper => { try { return localStorage.getItem(KEY) === "roll" ? "roll" : "a4" } catch { return "a4" } }

/** On-screen preview of an invoice with the same template the print uses (the A4 design chosen in settings, or the receipt roll). */
export function InvoicePreviewDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const output = useInvoiceOutput()
  const pdf = useInvoiceOutput()
  const [paper, setPaper] = useState<Paper>(readPaper)
  const [doc, setDoc] = useState<PrintDoc | null>(null)
  const [height, setHeight] = useState(400)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const id = invoice?.id
  const choose = (p: Paper) => { setPaper(p); try { localStorage.setItem(KEY, p) } catch { /* optional */ } }

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
    output.mutateAsync({ invoice: { id }, as: "preview", paper }).then((d) => { if (live && d) setDoc(d) }).catch(() => {})
    return () => { live = false }
  }, [id, paper])

  const pageW = doc ? PAPERS[doc.paper].px : 0
  // The whole page always fits inside the area (width and height), so the preview never scrolls; the narrow roll may be enlarged up to 1.5x.
  const scale = pageW && box.w && box.h ? Math.min((box.w - PAD * 2) / pageW, (box.h - PAD * 2) / height, paper === "roll" ? 1.5 : 1) : 1

  const title = t("sales.previewTitle", { number: invoice?.orderNumber })

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex h-[94dvh] max-h-[94dvh] flex-col gap-0 overflow-hidden bg-white p-0 text-foreground", paper === "roll" ? "sm:max-w-md" : "sm:max-w-3xl")}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{invoice?.customerName || t("sales.previewHint")}</DialogDescription>
        </DialogHeader>

        <div className="flex h-12 shrink-0 items-center justify-end gap-1.5 bg-white px-4 pe-12 print:hidden">
          <div className="flex rounded-md border bg-white p-0.5" role="radiogroup" aria-label={t("sales.previewFormat")}>
            {(["a4", "roll"] as const).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={paper === p} onClick={() => choose(p)}
                className={cn("h-6 rounded px-2 text-xs font-medium", paper === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >{p === "a4" ? t("sales.previewA4") : t("sales.previewRoll")}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 bg-white px-2 text-xs" disabled={!doc || pdf.isPending} onClick={() => id !== undefined && pdf.mutate({ invoice: { id }, as: "pdf", paper })}>
            {pdf.isPending ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}PDF
          </Button>
          <Button variant="outline" size="sm" className="h-7 bg-white px-2 text-xs" disabled={!doc} onClick={() => doc && printDocument(doc)}><Printer size={13} />{t("sales.actions.print")}</Button>
        </div>
        <div ref={setBoxEl} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white" style={{ padding: PAD }}>
          {doc ? (
            <div dir="ltr" className="shrink-0 overflow-hidden bg-white" style={{ position: "relative", width: pageW * scale, height: height * scale }}>
              <iframe
                title={title}
                srcDoc={renderDocument(doc).replace("</head>", `${FIT}</head>`)}
                scrolling="no"
                onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) { setHeight(d.documentElement.offsetHeight); void d.fonts.ready.then(() => setHeight(d.documentElement.offsetHeight)) } }}
                style={{ width: pageW, height, border: 0, background: "#fff", display: "block", position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={28} />
              {t("sales.previewLoading")}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
