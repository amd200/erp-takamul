import { PAPERS, renderDocument, type PrintDoc } from "./document"
import { withFrame } from "./frame"

/** Opens the print dialog for `doc` from a hidden frame, so nothing on the screen is disturbed. */
export function printDocument(doc: PrintDoc) {
  return withFrame(renderDocument(doc), PAPERS[doc.paper].px, (_, win) => {
    win.focus()
    win.print()
  }, 2000)
}
