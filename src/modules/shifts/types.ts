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

export type TreasuryLine = { treasuryId: number; treasuryName: string; invoicesCount: number; totalSales: number; totalReturns: number; totalExpenses: number; totalRevenues: number; netTotal: number; paymentCount?: number; paymentTotal?: number }

export type SoldItem = { productName: string; quantity: number; unitPrice: number; lineTotal: number }

export type EmployeeSales = { employeeName: string; salesInvoicesCount: number; returnInvoicesCount: number; totalSales: number; totalReturns: number; netSales: number }

export type ShiftReport = {
  shiftId: number
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
  totalPurchases?: number | null
  totalExpenses?: number | null
  totalRevenues?: number | null
  netTotal?: number | null
  soldItems?: SoldItem[] | null
  treasuries?: TreasuryLine[] | null
  employeeSalesSummary?: EmployeeSales[] | null
}

export type OpenShiftInput = { branchId: number; employeeId: number; deviceId: number; openingBalance: number }

/** An employee of the branch who can open a shift, as the server sends it. */
export type ShiftEmployee = { id: number; firstName: string }
/** A point-of-sale device, as the server sends it. */
export type ShiftDevice = { id: number; deviceName: string }

export type ShiftListResponse = { items: Shift[]; totalCount: number; pageNumber: number; pageSize: number }
export type ShiftQuery = { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }
