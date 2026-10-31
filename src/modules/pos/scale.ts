import type { Settings } from "@/modules/settings"

/**
 * A scale prints a fixed-length barcode: a flag, then the item code, then the weight (or the price).
 * Positions are 1-based, as the settings page shows them.
 */
export type ScaleRule = { type: "ByWeight" | "ByPrice"; length: number; flag: string; codeStart: number; codeLength: number; valueStart: number; valueLength: number; divideBy: number }

/** The scale rule from the barcode settings, or null when the branch has no scale barcodes. */
export function scaleRule(s: Settings): ScaleRule | null {
  const b = s.barcodeScale ?? {}
  const type = b.barcodeType
  if (type !== "ByWeight" && type !== "ByPrice") return null
  const n = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback)
  const codeStart = Math.max(0, n(b.barcodeStartPosition, 3) - 1)
  const codeLength = n(b.barcodeCodeCharactersCount, 5)
  const divideBy = n(b.barcodeDivideWeightBy, 1000)
  return {
    type,
    length: n(b.barcodeTotalCharacters, 13),
    flag: String(b.barcodeFlagCharacters ?? ""),
    codeStart,
    codeLength,
    valueStart: b.barcodeWeightStartPosition == null ? codeStart + codeLength : Math.max(0, n(b.barcodeWeightStartPosition, 8) - 1),
    valueLength: n(b.barcodeWeightCharactersCount, 5),
    // A divisor left at 0 would divide by nothing; grams to kilos is what scales print.
    divideBy: divideBy > 0 ? divideBy : 1000,
  }
}

/** Reads a scale barcode: the item code, and the weight to sell or the price the scale worked out. */
export function readScale(code: string, r: ScaleRule): { itemCode: string; quantity: number; price: number | null } | null {
  const c = code.trim()
  if (c.length !== r.length || !/^\d+$/.test(c) || c.slice(0, r.codeStart) !== r.flag) return null
  const value = Number(c.slice(r.valueStart, r.valueStart + r.valueLength))
  if (!Number.isFinite(value) || value <= 0) return null
  const itemCode = c.slice(r.codeStart, r.codeStart + r.codeLength)
  return r.type === "ByWeight" ? { itemCode, quantity: value / r.divideBy, price: null } : { itemCode, quantity: 1, price: value / 100 }
}

/** An item's own barcode matches the code on the scale label once both have the label's length. */
export const matchesScaleCode = (barcode: string, itemCode: string) => !!barcode && barcode.trim().padStart(itemCode.length, "0") === itemCode
