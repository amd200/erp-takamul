export type Shift = {
  id: number
  shiftDate: string
  startTime: string
  endDate: string | null
  endTime: string | null
  openingBalance: number
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  totalRevenues: number
  netTotal: number
  status: "Open" | "Closed"
  deviceId: string
  employeeName: string
  branchName: string
  deviceName: string
}

export type SoldItem = { productName: string; quantity: number; unitPrice: number; lineTotal: number }

/** `salesTreasuries` / `returnTreasuries` / `expenseTreasuries` / `unlinkedVoucherTreasuries` rows, as the server sends them. */
export type SalesTreasury = { treasuryId: number; treasuryName: string; invoicesCount: number; totalSales: number }
export type ReturnTreasury = { treasuryId: number; treasuryName: string; invoicesCount: number; totalReturns: number }
export type ExpenseTreasury = { treasuryId: number; treasuryName: string; expensesCount: number; totalExpenses: number }
export type VoucherTreasury = { treasuryId: number; treasuryName: string; vouchersCount: number; totalAmount: number }
/** The server sends only `finalNetTotal` for each treasury here (the other sums are not serialized). */
export type NetTreasury = { treasuryId: number; treasuryName: string; finalNetTotal: number }

export type EmployeeTreasury = { treasuryId: number; treasuryName: string; totalSales: number; totalReturns: number; netTotal: number }
export type EmployeeSales = {
  employeeId: number | null
  employeeName: string
  salesInvoicesCount: number
  salesInvoiceNumbers: string[]
  returnInvoicesCount: number
  returnInvoiceNumbers: string[]
  totalSales: number
  totalReturns: number
  netSales: number
  treasuries: EmployeeTreasury[]
}

export type ShiftReport = {
  shiftId: number
  shiftNumber?: string | null
  employeeName?: string | null
  shiftDate?: string | null
  startTime?: string | null
  endDate: string | null
  endTime: string | null
  openingBalance?: number | null
  salesInvoicesCount?: number | null
  salesSubTotal?: number | null
  salesTaxAmount?: number | null
  salesGrandTotal?: number | null
  deferredSalesInvoicesCount?: number | null
  deferredSalesInvoicesTotal?: number | null
  returnInvoicesCount?: number | null
  returnInvoicesTotal?: number | null
  returnInvoiceNumbers?: string[] | null
  soldItems?: SoldItem[] | null
  salesTreasuries?: SalesTreasury[] | null
  returnTreasuries?: ReturnTreasury[] | null
  expenseTreasuries?: ExpenseTreasury[] | null
  unlinkedVoucherTreasuries?: VoucherTreasury[] | null
  treasuries?: NetTreasury[] | null
  employeeSalesSummary?: EmployeeSales[] | null
}

export type OpenShiftInput = { branchId: number; employeeId: number; deviceId: number; openingBalance: number }

/** An employee of the branch who can open a shift, as the server sends it. */
export type ShiftEmployee = { id: number; firstName: string }
/** A point-of-sale device, as the server sends it. */
export type ShiftDevice = { id: number; deviceName: string }

/** The server sends every shift at once, wrapped as `{ success, message, data }` (no paging). */
export type ShiftListResponse = { success: boolean; message: string; data: Shift[] }
