import { useEffect, useState } from "react"
import { Loader2, Printer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PAPERS, printDocument, renderDocument, type PrintDoc } from "@/shared/print"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import type { SalesOrderDto } from "../types"

type Paper = "a4" | "roll"

/** On-screen preview of an invoice with the same template the print uses (the A4 design chosen in settings, or the receipt roll). */
export function InvoicePreviewDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const output = useInvoiceOutput()
  const [paper, setPaper] = useState<Paper>("a4")
  const [doc, setDoc] = useState<PrintDoc | null>(null)
  const [height, setHeight] = useState(400)
  const id = invoice?.id

  useEffect(() => {
    if (id === undefined) { setDoc(null); return }
    let live = true
    setDoc(null)
    output.mutateAsync({ invoice: { id }, as: "preview", paper }).then((d) => { if (live && d) setDoc(d) }).catch(() => {})
    return () => { live = false }
  }, [id, paper])

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader><DialogTitle>{t("sales.previewTitle", { number: invoice?.orderNumber })}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={paper === "a4" ? "default" : "outline"} onClick={() => setPaper("a4")}>{t("sales.previewA4")}</Button>
          <Button variant={paper === "roll" ? "default" : "outline"} onClick={() => setPaper("roll")}>{t("sales.previewRoll")}</Button>
          <Button variant="outline" className="ms-auto" disabled={!doc} onClick={() => doc && printDocument(doc)}><Printer size={14} />{t("sales.actions.print")}</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-md bg-muted p-3">
          {doc ? (
            <iframe
              title={t("sales.previewTitle", { number: invoice?.orderNumber })}
              srcDoc={renderDocument(doc)}
              scrolling="no"
              onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) { setHeight(d.documentElement.scrollHeight); void d.fonts.ready.then(() => setHeight(d.documentElement.scrollHeight)) } }}
              style={{ width: PAPERS[doc.paper].px, height, border: 0, background: "#fff", display: "block", margin: "0 auto" }}
            />
          ) : (
            <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin" /></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
