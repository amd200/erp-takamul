import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { PAPERS, renderDocument, type PrintDoc } from "./document"
import { withFrame } from "./frame"

/**
 * Prints `doc`. In the desktop app, with a `printer` that is installed on the computer, it goes straight to that printer and a
 * notice says what happened; otherwise (browser, no printer chosen, printer missing, print failed) the print dialog opens
 * from a hidden frame, so nothing on the screen is disturbed.
 */
export async function printDocument(doc: PrintDoc, printer?: string | null) {
  const html = renderDocument(doc)
  if (printer && window.desktop) {
    const r = await window.desktop.print(html, printer, PAPERS[doc.paper].px)
    if (r.ok) return void toast.success(i18n.t("desktopPrint.sent", { printer, size: r.size, info: r.info }))
    toast.warning(i18n.t("desktopPrint.failed", { printer, reason: r.reason, info: r.info }))
  }
  return withFrame(html, PAPERS[doc.paper].px, (_, win) => {
    win.focus()
    win.print()
  }, 2000)
}
