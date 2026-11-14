import { esc } from "./document"

/** Whether the currency symbol/code means the Saudi riyal (SAR, SR, ر.س, ﷼ ...). */
export const isRiyal = (s: string) => /^\s*(sar|sr|s\.r\.?|ر\.?\s?س\.?|ريال|﷼|⃁)\s*$/i.test(s)

/** The Saudi riyal sign (lucide "saudi-riyal") as inline SVG for printed documents; `size` is any CSS length. */
export const riyalIcon = (size = "1em") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em"><path d="m20 19.5-5.5 1.2"/><path d="M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2"/><path d="m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16"/><path d="M20 10 4 13.5"/></svg>`

/** A printed amount's currency: the riyal sign for the riyal, else the settings' text symbol. */
export const currencyMark = (symbol: string | undefined, size?: string) => {
  const s = symbol || "SAR"
  return isRiyal(s) ? riyalIcon(size) : esc(s)
}
