import { http } from "@/shared/http/request"
import { ApiError } from "@/shared/http/ApiError"
import { writeLocal } from "./local"
import { emptyLoyalty, type LoyaltyValues } from "./schema"
import type { GroupKey, LoyaltyPoints, Settings, SettingValue } from "./types"

/** Printers the QZ Tray agent reports on this machine. */
export const PRINTERS = ["Kitchen-Epson-TM20", "Bar-Xprinter-80", "HP-LaserJet-A4"]

/** A form's values: field values by the server group they belong to (or `local`, kept in this browser). */
export type Values = Record<string, Record<string, SettingValue>>

/** The PUT that saves each server group. */
const ENDPOINT: Record<GroupKey, string> = {
  generalTab: "/Settings/tabs/general",
  paymentTab: "/Settings/tabs/payment",
  shiftsTab: "/Settings/tabs/shifts",
  printA4Tab: "/Settings/tabs/print-a4",
  operationsTab: "/Settings/tabs/operations",
  tablesTab: "/Settings/tabs/tables",
  salonsTab: "/Settings/tabs/salons",
  printRollTab: "/Settings/tabs/print-roll",
  salesScreenTab: "/Settings/tabs/sales-screen",
  preparationTicketTab: "/Settings/tabs/preparation-ticket",
  preparationScreenTab: "/Settings/tabs/preparation-screen",
  vouchersPrintTab: "/Settings/tabs/vouchers-print",
  purchasesScreenTab: "/Settings/tabs/purchases-screen",
  customersTab: "/Settings/tabs/customers",
  itemsTab: "/Settings/tabs/items",
  suppliersTab: "/Settings/tabs/suppliers",
  appearanceTab: "/Settings/tabs/appearance",
  notificationsTab: "/Settings/tabs/notifications",
  // settings no tab carries yet
  sales: "/Settings/sales",
  print: "/Settings/Printting",
  taxSetting: "/Settings/tax",
  tobaccoFees: "/Settings/tobacco",
  barcodeScale: "/Settings/barcode",
  whatsApp: "/Settings/whatsapp",
}

/** The last settings read, so the screens have something to draw before the first answer arrives. */
let latest: Settings = {}

/** What a form starts with: the server's (or this browser's) value for each field of `empty`, else the default. */
export function valuesOf<T extends Values>(empty: T, s: Settings, local: Record<string, SettingValue>): T {
  return Object.fromEntries(Object.entries(empty).map(([group, fields]) => {
    const held = (group === "local" ? local : (s as Record<string, Record<string, SettingValue> | undefined>)[group]) ?? {}
    return [group, Object.fromEntries(Object.entries(fields).map(([key, fallback]) => {
      const v = held[key]
      return [key, v === undefined || (v === null && fallback !== null) ? fallback : v]
    }))]
  })) as T
}

export const settingsApi = {
  /** Synchronous read for first paint; the real answer follows. */
  snapshot: () => latest,

  get: async () => (latest = await http<Settings>("/Settings")),

  /**
   * Saves what a form changed. Each server group with a change is read fresh, the changes are put into it, and it is
   * sent back whole with its own PUT, so fields the page does not show keep their values.
   */
  save: async (data: Values, saved: Values) => {
    const changes = Object.entries(data)
      .map(([group, fields]) => [group, Object.fromEntries(Object.entries(fields).filter(([key, v]) => v !== saved[group]?.[key]))] as const)
      .filter(([, fields]) => Object.keys(fields).length > 0)
    const server = changes.filter(([group]) => group !== "local")
    if (server.length) {
      const fresh = await http<Settings>("/Settings")
      // One request at a time: a failure then leaves the earlier groups saved and the rest untouched.
      for (const [group, fields] of server) {
        await http<unknown>(ENDPOINT[group as GroupKey], { method: "PUT", data: { ...fresh[group as GroupKey], ...fields } })
      }
    }
    const local = changes.find(([group]) => group === "local")
    if (local) writeLocal(local[1])
    return settingsApi.get()
  },

  /** Real endpoint: PUT /Settings/loyalty-points */
  setLoyaltyEnabled: (enableLoyaltyPoints: boolean) => http<unknown>("/Settings/loyalty-points", { method: "PUT", data: { enableLoyaltyPoints } }),

  /** Real endpoint: POST /zatca-invoices/sell-all-unsent */
  resendUnsent: async () => {
    const res = await http<{ totalCount?: number; successCount?: number; failedCount?: number }>("/zatca-invoices/sell-all-unsent", { method: "POST" })
    return { total: res?.totalCount ?? 0, sent: res?.successCount ?? 0, failed: res?.failedCount ?? 0 }
  },
}

/** .NET `DayOfWeek` names, by number (0 = Sunday, as `Date.getDay()`). */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** The loyalty tab's form values: the record (or the server's defaults when there is none) and the on/off switch. */
export function loyaltyFormOf(rec: LoyaltyPoints | null | undefined, enabled: boolean | undefined): LoyaltyValues {
  const base = emptyLoyalty.loyalty
  return {
    enableLoyaltyPoints: enabled === true,
    loyalty: rec ? {
      calculationScope: rec.calculationScope === "SelectedCategories" ? "SelectedCategories" : "AllCategories",
      selectedCategoryIds: rec.selectedCategoryIds ?? [],
      workingDays: (rec.workingDays ?? []).map((d) => (typeof d === "number" ? d : DAY_NAMES.indexOf(d))).filter((d) => d >= 0 && d <= 6),
      earningInvoiceAmount: rec.earningInvoiceAmount ?? base.earningInvoiceAmount,
      earnedPoints: rec.earnedPoints ?? base.earnedPoints,
      redemptionPoints: rec.redemptionPoints ?? base.redemptionPoints,
      minimumRedemptionInvoiceAmount: rec.minimumRedemptionInvoiceAmount ?? base.minimumRedemptionInvoiceAmount,
      redemptionDiscountAmount: rec.redemptionDiscountAmount ?? base.redemptionDiscountAmount,
    } : base,
  }
}

export const loyaltyApi = {
  /** GET /LoyaltyPoints. 404 means no record has been saved yet: `null`, and the tab shows the server's defaults. */
  get: async () => {
    try {
      return await http<LoyaltyPoints>("/LoyaltyPoints")
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  /**
   * Saves what the tab changed: the rules with PUT /LoyaltyPoints (creates the record or updates it; days are sent as
   * `DayOfWeek` numbers), then the switch with PUT /Settings/loyalty-points. Rules first, so a refused rule does not
   * leave the program switched on.
   */
  save: async (data: LoyaltyValues, saved: LoyaltyValues) => {
    if (JSON.stringify(data.loyalty) !== JSON.stringify(saved.loyalty)) {
      const all = data.loyalty.calculationScope === "AllCategories"
      await http<unknown>("/LoyaltyPoints", { method: "PUT", data: { ...data.loyalty, selectedCategoryIds: all ? [] : data.loyalty.selectedCategoryIds } })
    }
    if (data.enableLoyaltyPoints !== saved.enableLoyaltyPoints) await settingsApi.setLoyaltyEnabled(data.enableLoyaltyPoints)
  },
}
