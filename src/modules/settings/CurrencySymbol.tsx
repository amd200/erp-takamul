import { SaudiRiyal } from "lucide-react"
import { useCurrency } from "./useCurrency"

/** Whether the currency symbol/code means the Saudi riyal (SAR, SR, ر.س, ﷼ ...). */
export const isRiyal = (s: string) => /^\s*(sar|sr|s\.r\.?|ر\.?\s?س\.?|ريال|﷼|⃁)\s*$/i.test(s)

/** The default currency from settings: the app's riyal icon for the riyal, the text symbol for any other currency. `size` is px; without it the mark follows the surrounding font size. */
export function CurrencySymbol({ size, className }: { size?: number; className?: string }) {
  const symbol = useCurrency()
  if (isRiyal(symbol)) return <SaudiRiyal aria-hidden="true" size={size ?? "1em"} className={className ?? "inline-block shrink-0 align-[-0.1em]"} />
  return <span aria-hidden="true" className={className ?? "shrink-0 leading-none"} style={size ? { fontSize: size } : undefined}>{symbol}</span>
}
