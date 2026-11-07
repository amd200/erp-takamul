import { useCallback, useEffect, useState } from "react"
import { Loader2, Printer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PAPERS, printDocument, renderDocument, type PrintDoc } from "@/shared/print"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import type { SalesOrderDto } from "../types"

type Paper = "a4" | "roll"

/** Preview only: the page is as tall as its content (the A4 templates force a full-sheet height for printing). */
const FIT = "<style>html,body,.invoice-page{min-height:0!important;height:auto!important}</style>"

/** On-screen preview of an invoice with the same template the print uses (the A4 design chosen in settings, or the receipt roll). */
export function InvoicePreviewDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const output = useInvoiceOutput()
  const [paper, setPaper] = useState<Paper>("a4")
  const [doc, setDoc] = useState<PrintDoc | null>(null)
  const [height, setHeight] = useState(400)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const id = invoice?.id

  /** Track the preview area so the page can be scaled to fit it (no scrollbars). */
  const setBoxEl = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
  }, [])

  useEffect(() => {
    if (id === undefined) { setDoc(null); return }
    let live = true
    setDoc(null)
    output.mutateAsync({ invoice: { id }, as: "preview", paper }).then((d) => { if (live && d) setDoc(d) }).catch(() => {})
    return () => { live = false }
  }, [id, paper])

  const pageW = doc ? PAPERS[doc.paper].px : 0
  const scale = doc && box.w && box.h ? Math.min(1, (box.w - 24) / pageW, (box.h - 24) / height) : 1

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader><DialogTitle>{t("sales.previewTitle", { number: invoice?.orderNumber })}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={paper === "a4" ? "default" : "outline"} onClick={() => setPaper("a4")}>{t("sales.previewA4")}</Button>
          <Button variant={paper === "roll" ? "default" : "outline"} onClick={() => setPaper("roll")}>{t("sales.previewRoll")}</Button>
          <Button variant="outline" className="ms-auto" disabled={!doc} onClick={() => doc && printDocument(doc)}><Printer size={14} />{t("sales.actions.print")}</Button>
        </div>
        <div ref={setBoxEl} className="h-[75vh] overflow-hidden rounded-md bg-muted p-3">
          {doc ? (
            <div dir="ltr" style={{ position: "relative", overflow: "hidden", width: pageW * scale, height: height * scale, margin: "0 auto" }}>
            <iframe
              title={t("sales.previewTitle", { number: invoice?.orderNumber })}
              srcDoc={renderDocument(doc).replace("</head>", `${FIT}</head>`)}
              scrolling="no"
              onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) { setHeight(d.documentElement.offsetHeight); void d.fonts.ready.then(() => setHeight(d.documentElement.offsetHeight)) } }}
              style={{ width: pageW, height, border: 0, background: "#fff", display: "block", position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
            />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin" /></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
