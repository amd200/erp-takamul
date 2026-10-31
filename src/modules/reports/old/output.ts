import { downloadPdf, esc, printDocument, type PrintDoc } from "@/shared/print"
import type { SummaryCard } from "./ReportShell"

export type OutputColumn<T> = { header: string; value: (row: T, index: number) => string | number }
export type ReportOutput<T> = { title: string; filters: string; cards: SummaryCard[]; columns: OutputColumn<T>[]; rows: T[] }

const CSS = `body{padding:8mm 8mm}h1{font-size:16px;text-align:center;margin:0 0 6px}.f{font-size:10px;text-align:center;color:#444;margin-bottom:10px}
.cards{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}.card{flex:1 1 22%;border:1px solid #bbb;border-radius:6px;padding:6px 8px}.card b{display:block;font-size:13px}.card span{font-size:10px;color:#444}
table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #999;padding:4px 6px;text-align:center}th{background:#eee}`

const docOf = <T,>(o: ReportOutput<T>): PrintDoc => ({
  title: o.title, paper: "a4", css: CSS,
  body: `<h1>${esc(o.title)}</h1><div class="f">${esc(o.filters)}</div>
<div class="cards">${o.cards.map((c) => `<div class="card"><span>${esc(c.title)}</span><b>${esc(c.value)}${c.suffix ? ` ${esc(c.suffix)}` : ""}</b></div>`).join("")}</div>
<table><thead><tr>${o.columns.map((c) => `<th>${esc(c.header)}</th>`).join("")}</tr></thead>
<tbody>${o.rows.map((r, i) => `<tr>${o.columns.map((c) => `<td>${esc(c.value(r, i))}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
})

export const printReport = <T,>(o: ReportOutput<T>) => printDocument(docOf(o))
export const pdfReport = <T,>(o: ReportOutput<T>) => downloadPdf(docOf(o), o.title)

/** Excel-readable CSV (UTF-8 with a byte-order mark, so Arabic opens correctly). */
export function excelReport<T>(o: ReportOutput<T>) {
  const cell = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const lines = [o.columns.map((c) => c.header), ...o.rows.map((r, i) => o.columns.map((c) => c.value(r, i)))]
  const blob = new Blob(["﻿" + lines.map((l) => l.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${o.title}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export const money = (v?: number | null) => Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const dayText = (v?: string | null) => (v ? new Date(v).toLocaleDateString("en-GB") : "")
