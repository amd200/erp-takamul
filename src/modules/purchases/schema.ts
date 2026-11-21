import { z } from "zod"
import { lineSchema, paymentFormSchema } from "@/modules/sales/schema"
import type { InvoiceLine } from "@/modules/sales/types"
import type { PurchaseItemDto } from "./types"

export const purchaseSchema = z.object({
  supplierId: z.number({ error: "validation.supplierRequired" }).min(1, "validation.supplierRequired"),
  warehouseId: z.number({ error: "validation.warehouseRequired" }).min(1, "validation.warehouseRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  notes: z.string(),
  lines: z.array(lineSchema).min(1, "validation.linesRequired"),
  payments: z.array(paymentFormSchema),
})

export type PurchaseForm = z.infer<typeof purchaseSchema>

const today = () => new Date().toISOString().slice(0, 10)
export const emptyPurchase = (): PurchaseForm => ({ supplierId: 0, warehouseId: 0, date: today(), notes: "", lines: [], payments: [] })

/**
 * A saved purchase line as an editable one. Costs come back before tax, so the line is tax-exclusive;
 * the discount is per unit on the wire. The tax rate is filled in by the page from the tax list.
 */
export const purchaseLineOf = (d: PurchaseItemDto): InvoiceLine => ({
  productId: d.productId, taxId: d.taxId ?? undefined, unitId: d.unitId ?? 0, productName: d.productName ?? "", unitName: d.unitName ?? "", quantity: d.quantity,
  unitPrice: d.priceBeforeTax ?? d.unitPrice ?? 0, taxPercentage: 0, taxCalculation: 2,
  discountKind: (d.discountPercentage ?? 0) > 0 ? "percent" : "value",
  discount: (d.discountPercentage ?? 0) > 0 ? d.discountPercentage ?? 0 : (d.discountValue ?? 0) * d.quantity,
  amounts: { discount: (d.discountValue ?? 0) * d.quantity, tax: d.taxAmount ?? 0, total: d.lineTotal ?? 0 },
})
