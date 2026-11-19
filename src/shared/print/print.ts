import { PAPERS, renderDocument, type PrintDoc } from "./document"
import { withFrame } from "./frame"

/**
 * Prints `doc`. In the desktop app, with a `printer` that is installed on the computer, it goes straight to that printer;
 * otherwise (browser, no printer chosen, printer missing) the print dialog opens from a hidden frame, so nothing on the screen is disturbed.
 */
export async function printDocument(doc: PrintDoc, printer?: string | null) {
  const html = renderDocument(doc)
  if (printer && window.desktop && (await window.desktop.print(html, printer))) return
  return withFrame(html, PAPERS[doc.paper].px, (_, win) => {
    win.focus()
    win.print()
  }, 2000)
}
