/** Mirrors /UnitOfMeasure, as the server sends it. taxCode is the unit code used on e-invoices (PCE, KGM...). */
export type Unit = {
  id: number
  branchId?: number | null
  name: string
  description?: string | null
  taxCode?: string | null
}

export type UnitInput = { name: string; taxCode: string; description: string }
