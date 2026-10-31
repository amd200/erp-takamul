import { PAPERS, renderDocument, type PrintDoc } from "./document"
import { withFrame } from "./frame"

/**
 * Saves `doc` as a PDF that looks exactly like the printout: the browser renders the same HTML,
 * it is captured as an image. A receipt roll becomes ONE page as tall as the content (nothing is ever cut);
 * an A4 document is split into A4 pages. The two libraries are loaded only when a PDF is actually requested.
 */
export async function downloadPdf(doc: PrintDoc, fileName: string) {
  const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")])
  const width = PAPERS[doc.paper].px
  const blob = await withFrame(renderDocument(doc, "pdf"), width, async (d) => {
    const height = d.documentElement.scrollHeight
    const canvas = await domToCanvas(d.documentElement, { scale: 2, width, height, backgroundColor: "#ffffff" })
    const canvasImage = canvas
    if (doc.paper === "a4" || doc.paper === "a5") {
      // Sheet-size documents run over as many pages as they need, the way they print.
      const pdf = new jsPDF({ unit: "px", format: doc.paper, compress: true })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvasImage.height * pageW) / canvasImage.width
      for (let y = 0; y < imgH - 1; y += pageH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(canvasImage, "PNG", 0, -y, pageW, imgH, undefined, "FAST")
      }
      return pdf.output("blob")
    }
    // A receipt roll is one page as tall as the content, so nothing is ever cut.
    const pdf = new jsPDF({ unit: "px", format: [width, height], orientation: height >= width ? "portrait" : "landscape", compress: true })
    pdf.addImage(canvasImage, "PNG", 0, 0, width, height, undefined, "FAST")
    return pdf.output("blob")
  })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
