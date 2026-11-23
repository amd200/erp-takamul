import { esc } from "@/shared/print"
import { code128 } from "./code128"
import type { LabelSettings } from "./settings"

export type LabelData = { company: string; name: string; price: number; currency: string; priceLabel: string; barcode: string }

const FONT = "Cairo,Tahoma,sans-serif"
/** Space between the label's edge and its content, so nothing touches the paper edge. */
const PAD_MM = 2

function bars(code: string, height: number) {
  const widths = code128(code)
  if (!widths.length) return ""
  const total = widths.reduce((s, w) => s + w, 0)
  let x = 0
  const rects = widths.map((w, i) => { const r = i % 2 === 0 ? `<rect x="${x}" width="${w}" height="1"/>` : ""; x += w; return r }).join("")
  return `<svg viewBox="0 0 ${total} 1" preserveAspectRatio="none" shape-rendering="crispEdges" style="display:block;width:100%;height:${height}px">${rects}</svg>`
}

const line = (text: string, size: number, spacing: number, weight: number) =>
  `<div style="width:100%;font-size:${Math.max(4, size)}px;letter-spacing:${spacing}px;font-weight:${weight};line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(text)}</div>`

/** One label as HTML. The screen preview and the printout use this same markup, so they match. */
export function labelHtml(d: LabelData, s: LabelSettings) {
  const price = `${d.priceLabel}: ${d.price}${s.showCurrency ? ` ${d.currency}` : ""}`
  return `<div class="label" style="width:${s.width}mm;height:${s.height}mm;padding:${PAD_MM}mm;box-sizing:border-box;overflow:hidden;background:#fff;color:#000;font-family:${FONT};text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-start">`
    + (s.showCompany ? line(d.company, s.company.fontSize, s.company.spacing, 700) : "")
    + (s.showName ? line(d.name, s.name.fontSize, s.name.spacing, 600) : "")
    + (s.showPrice ? line(price, s.price.fontSize, s.price.spacing, 700) : "")
    + `<div style="width:100%;margin-top:auto;min-height:0">${bars(d.barcode, s.barcodeHeight)}<div dir="ltr" style="font-size:${s.numberSize}px;line-height:1.2;overflow:hidden">${esc(d.barcode)}</div></div></div>`
}

/** The whole print document: every label is one page of the label's own size. */
export function labelsDocument(labels: string, s: LabelSettings, title: string, dir: string) {
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" crossorigin="anonymous">
<style>@page{size:${s.width}mm ${s.height}mm;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#fff}.label{break-after:page;page-break-after:always}.label:last-child{break-after:auto;page-break-after:auto}</style></head><body>${labels}</body></html>`
}
