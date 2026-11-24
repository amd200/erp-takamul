import { z } from "zod"
import { PAYMENT_METHODS } from "./types"

const num = (msg = "validation.number") => z.number({ error: msg })

const lineFields = z.object({
  productId: z.number(),
  taxId: z.number().optional(),
  unitId: z.number(),
  productName: z.string().trim().min(1, "validation.nameRequired"),
  unitName: z.string(),
  quantity: num().positive("validation.qtyPositive"),
  unitPrice: num().min(0, "validation.min0"),
  taxPercentage: z.number(),
  taxCalculation: z.union([z.literal(1), z.literal(2)]),
  discountKind: z.enum(["percent", "value"]),
  discount: num().min(0, "validation.min0"),
  categoryDiscount: z.object({ kind: z.enum(["percent", "value"]), value: z.number() }).optional(),
})

export const lineSchema = lineFields.refine((l) => l.discountKind !== "percent" || l.discount <= 100, { path: ["discount"], message: "validation.percentMax" })

/** A return line is the invoice line it comes from (same fields) plus its id; only the quantity can change, and 0 means not returned. */
const returnLineSchema = lineFields.extend({ originalItemId: z.number(), quantity: num().min(0, "validation.min0") })

const paymentSchema = z.object({
  /** 0 is allowed (the "cancel credit" button zeroes payments); negatives are refused. */
  amount: num().min(0, "validation.min0"),
  method: z.enum(PAYMENT_METHODS),
  treasuryId: num("validation.treasuryRequired").min(1, "validation.treasuryRequired"),
  notes: z.string(),
})

export const invoiceSchema = z.object({
  date: z.string().min(1, "validation.dateRequired"),
  customerId: num("validation.customerRequired").min(1, "validation.customerRequired"),
  warehouseId: num("validation.warehouseRequired").min(1, "validation.warehouseRequired"),
  notes: z.string(),
  globalDiscountKind: z.enum(["percent", "value"]),
  globalDiscount: num().min(0, "validation.min0"),
  lines: z.array(lineSchema).min(1, "validation.linesRequired"),
  payments: z.array(paymentSchema),
})
export type InvoiceForm = z.infer<typeof invoiceSchema>

export const paymentFormSchema = paymentSchema
export type PaymentForm = z.infer<typeof paymentSchema>

export const debitNoteSchema = z.object({
  invoiceId: num("validation.invoiceRequired").min(1, "validation.invoiceRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  reason: z.string().trim().min(1, "validation.reasonRequired"),
  lines: z.array(lineSchema).min(1, "validation.linesRequired"),
  payments: z.array(paymentSchema),
})
export type DebitNoteForm = z.infer<typeof debitNoteSchema>

export const returnSchema = z.object({
  date: z.string().min(1, "validation.dateRequired"),
  reason: z.string(),
  lines: z.array(returnLineSchema),
  payments: z.array(z.object({ treasuryId: z.number().min(1, "validation.required"), amount: z.number().min(0, "validation.min0") })),
})
export type ReturnForm = z.infer<typeof returnSchema>

export const today = () => new Date().toISOString().slice(0, 10)
