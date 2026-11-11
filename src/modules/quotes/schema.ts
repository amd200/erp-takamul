import { z } from "zod"
import { lineSchema } from "@/modules/sales/schema"

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

const today = () => new Date().toISOString().slice(0, 10)

export const emptyQuote = (): QuoteForm => ({ customerId: 0, date: today(), notes: "", globalDiscountKind: "value", globalDiscount: 0, shipping: 0, lines: [] })
