import type { SettingValue } from "./types"

/**
 * Settings the server has no field for (the mail server) live in this browser. They survive a reload but are not
 * shared with other devices.
 */
const KEY = "erp.settings.local"

export function readLocal(): Record<string, SettingValue> {
  try {
    const raw = localStorage.getItem(KEY)
    const v = raw ? JSON.parse(raw) : {}
    return v && typeof v === "object" && !Array.isArray(v) ? v : {}
  } catch {
    return {}
  }
}

export function writeLocal(values: Record<string, SettingValue>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readLocal(), ...values }))
  } catch {
    /* private mode or blocked storage: the setting then lasts until the page is closed */
  }
}
