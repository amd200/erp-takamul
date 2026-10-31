import { z } from "zod"

const text = z.string().trim().min(1, "validation.required")
const num = z.number({ error: "validation.number" })

export const deliverySchema = z.object({ name: text })
export const currencySchema = z.object({ code: text, name: text, symbol: text, isDefault: z.boolean() })
export const taxSchema = z.object({ name: text, amount: num.min(0, "validation.minValue") })
export const reasonSchema = z.object({ taxExemptionReasonCode: text, taxExemptionReasonText: text, taxId: num })
export const tableSchema = z.object({ tableName: text })
export const pricingSchema = z.object({
  nameAr: text, systemType: z.enum(["Local", "Delivery"]), adjustmentType: z.enum(["Value", "Percentage"]), value: num.min(0, "validation.minValue"),
})
export const discountSchema = z.object({ categoryId: num, discountValue: num.min(0, "validation.minValue"), discountType: z.enum(["Percentage", "FixedAmount"]) })
