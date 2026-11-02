import i18n from "@/shared/i18n"

/** Paper the document is laid out for. Print and PDF use the same width, so both look alike. */
export const PAPERS = {
  roll80: { width: "80mm", px: 302, padding: "3mm" },
  a4: { width: "210mm", px: 794, padding: "8mm" },
  a5: { width: "148mm", px: 559, padding: "0" },
} as const
export type Paper = keyof typeof PAPERS

/** A printable page: its own markup and styles on top of the shared base below. */
export type PrintDoc = {
  title: string
  paper: Paper
  /** The page's inner HTML. Escape every value that comes from data with `esc`. */
  body: string
  css?: string
  /** The page's font; Cairo unless a template (e.g. the A4 invoice) was designed with another. */
  font?: "Cairo" | "Alexandria"
  /** Extra rules used only when the page is captured for a PDF (the capture draws some boxes a few pixels off). */
  pdfCss?: string
  /** Let the print dialog pick the sheet: the page then takes the width of the paper chosen there (a fixed size would be centred on a bigger sheet instead). */
  anySheet?: boolean
  /** A complete HTML document (its own head, styles and font); used as it is, without the shared base styles. */
  html?: string
}

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
export const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => entities[c])

// `crossorigin` lets the PDF capture read the font file and embed it; without it the capture falls back to Arial.
const fontUrl = (font: string) => `https://fonts.googleapis.com/css2?family=${font}:wght@400;500;600;700&display=swap`

// Every sheet keeps its own inner padding (the @page margin is 0 and the browser ignores it when margins are set to None), so content never touches the paper edge.
// Shared look for every printout: Cairo, black on white, a few helpers (.row, .muted, hr, table).
const base = (paper: Paper, font: string, anySheet = false) => {
  const p = PAPERS[paper]
  return `@page{size:${anySheet ? "auto" : `${p.width} auto`};margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;background:#fff;color:#000}body{width:${p.width};padding:${p.padding};font:12px/1.6 ${font},Tahoma,sans-serif}
h1{margin:0 0 4px;font-size:15px;text-align:center}h2{margin:10px 0 4px;font-size:13px}.c{text-align:center}.muted{color:#444;font-size:10px}
hr{border:0;border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between;gap:8px}.row>span:first-child{white-space:nowrap}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}.b{font-weight:700}.big{font-size:14px}
table{width:100%;border-collapse:collapse}th{font-size:10px;text-align:start;border-bottom:1px solid #000}td{padding:2px 0;vertical-align:top}
th:not(:first-child),td:not(:first-child){text-align:end;white-space:nowrap;padding-inline-start:6px}`
}

/** The full HTML document for `doc`, in the current language direction. */
export function renderDocument(doc: PrintDoc, mode: "print" | "pdf" = "print") {
  if (doc.html) return doc.html
  const font = doc.font ?? "Cairo"
  return `<!doctype html><html lang="${i18n.language}" dir="${i18n.dir()}"><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${fontUrl(font)}" rel="stylesheet" crossorigin="anonymous"><style>${base(doc.paper, font, doc.anySheet)}${doc.css ?? ""}${mode === "pdf" ? doc.pdfCss ?? "" : ""}</style></head><body>${doc.body}</body></html>`
}
