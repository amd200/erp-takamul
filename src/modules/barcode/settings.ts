import { useState } from "react"

export type TextStyle = { fontSize: number; spacing: number }

/** How the label looks. Kept in this browser, as in the current system, so the next visit starts where this one ended. */
export type LabelSettings = {
  /** Label size in millimetres. */
  width: number
  height: number
  /** Barcode bars height and number size, in pixels. */
  barcodeHeight: number
  numberSize: number
  showCompany: boolean
  showName: boolean
  showPrice: boolean
  showCurrency: boolean
  company: TextStyle
  name: TextStyle
  price: TextStyle
}

export const DEFAULT_SETTINGS: LabelSettings = {
  width: 40, height: 30, barcodeHeight: 40, numberSize: 12,
  showCompany: true, showName: true, showPrice: true, showCurrency: true,
  company: { fontSize: 15, spacing: 0 }, name: { fontSize: 15, spacing: 0 }, price: { fontSize: 15, spacing: 0 },
}

const KEY = "barcode_print_settings"

function load(): LabelSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<LabelSettings> | null
    if (!saved) return DEFAULT_SETTINGS
    return {
      ...DEFAULT_SETTINGS, ...saved,
      company: { ...DEFAULT_SETTINGS.company, ...saved.company },
      name: { ...DEFAULT_SETTINGS.name, ...saved.name },
      price: { ...DEFAULT_SETTINGS.price, ...saved.price },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useLabelSettings() {
  const [settings, setSettings] = useState(load)
  const apply = (next: LabelSettings) => {
    setSettings(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked: the settings just are not remembered */ }
  }
  return { settings, change: (patch: Partial<LabelSettings>) => apply({ ...settings, ...patch }), reset: () => apply(DEFAULT_SETTINGS) }
}
