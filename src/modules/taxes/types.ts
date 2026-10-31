/** /Taxes, as the server sends it: `amount` is the rate in percent. */
export type Tax = { id: number; name: string; amount?: number | null }

/** /TaxExemptionReasons, as the server sends it. */
export type ExemptionReason = { id: number; taxId?: number | null; taxExemptionReasonCode?: string | null; taxExemptionReasonText?: string | null; isActive?: boolean | null }
