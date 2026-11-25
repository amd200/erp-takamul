import type { Settings } from "@/modules/settings/types"

/** The paper the sales screens print an invoice on, from the sales screen's invoice type setting: 2 is the roll, 3 is A5, anything else A4. */
export const invoicePaperOf = (settings: Settings) => {
  const type = settings.salesScreenTab?.sales2InvoiceType
  return type === 2 ? "roll" : type === 3 ? "a5" : "a4"
}
