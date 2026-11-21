import { z } from "zod"
import { lineSchema } from "@/modules/sales/schema"
import type { InvoiceLine } from "@/modules/sales/types"
import type { QuoteItemDto } from "./types"

export const quoteSchema = z.object({
  customerId: z.number({ error: "validation.customerRequired" }).min(1, "validation.customerRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  notes: z.string(),
  globalDiscountKind: z.enum(["value", "percent"]),
  globalDiscount: z.number({ error: "validation.number" }).min(0, "validation.min0"),
  shipping: z.number({ error: "validation.number" }).min(0, "validation.min0"),
  lines: z.array(lineSchema).min(1, "validation.linesRequired"),
})

export type QuoteForm = z.infer<typeof quoteSchema>

/** Prices come back before tax, so a saved line is an editable tax-exclusive one; what the server worked out is kept for display. */
export const quoteLineOf = (d: QuoteItemDto): InvoiceLine => ({
  productId: d.productId,
  unitId: d.baseUnitId ?? 0,
  productName: d.productName ?? "",
  unitName: d.baseUnitName ?? "",
  quantity: d.quantity,
  unitPrice: d.priceBeforeTax ?? d.unitPrice ?? 0,
  taxPercentage: d.taxPercentage ?? 0,
  taxCalculation: 2,
  discountKind: (d.discountPercentage ?? 0) > 0 ? "percent" : "value",
  discount: (d.discountPercentage ?? 0) > 0 ? d.discountPercentage ?? 0 : d.discountAmount ?? 0,
  amounts: { discount: d.discountAmount ?? 0, tax: d.taxAmount ?? 0, total: d.lineTotal ?? 0 },
})

const today = () => new Date().toISOString().slice(0, 10)

export const emptyQuote = (): QuoteForm => ({ customerId: 0, date: today(), notes: "", globalDiscountKind: "value", globalDiscount: 0, shipping: 0, lines: [] })
