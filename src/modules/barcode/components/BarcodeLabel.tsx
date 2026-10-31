import { formatMoney } from "@/lib/format"

/** Deterministic bar pattern from the digits; enough to preview a label's layout. Printing uses a real encoder. */
function Bars({ code }: { code: string }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (const ch of code.padEnd(13, "0")) {
    const d = Number(ch) || 0
    bars.push({ x, w: 1 + (d % 3) })
    x += 2 + (d % 3) + (d % 2)
  }
  return (
    <svg viewBox={`0 0 ${x} 24`} className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
      {bars.map((b, i) => <rect key={i} x={b.x} width={b.w} height="24" fill="currentColor" />)}
    </svg>
  )
}

/** Labels print black on white whatever the screen theme is. */
export function BarcodeLabel({ name, barcode, price, currency }: { name: string; barcode: string; price: number; currency: string }) {
  return (
    <div className="mx-auto w-56 rounded-lg border bg-white p-3 text-center text-black">
      <div className="truncate text-[13px] font-semibold">{name}</div>
      <div className="my-1.5"><Bars code={barcode} /></div>
      <div className="text-[11px] tracking-widest" dir="ltr">{barcode}</div>
      <div className="mt-1 text-sm font-semibold">{formatMoney(price)} {currency}</div>
    </div>
  )
}
