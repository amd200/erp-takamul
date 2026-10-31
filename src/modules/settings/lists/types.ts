export type DeliveryCompany = { id: number; name: string }
export type Currency = { id: number; code: string; name: string; symbol: string; isDefault: boolean }
export type Tax = { id: number; name: string; amount: number }
export type ExemptionReason = { id: number; taxExemptionReasonCode: string; taxExemptionReasonText: string; taxId: number; isActive: boolean }
export type DiningTable = { id: number; tableName: string; status: "Free" | "Occupied" }
export type PricingSystem = { id: number; nameAr: string; systemType: "Local" | "Delivery"; adjustmentType: "Value" | "Percentage"; value: number }
export type CategoryDiscount = {
  id: number; categoryId: number; categoryNameAr: string; discountValue: number; discountType: "Percentage" | "FixedAmount"; isActive: boolean
}
