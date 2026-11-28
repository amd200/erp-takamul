/**
 * Records every activity starts with, whatever its business: the demo account, the one default customer,
 * the always-open shift, units, tax and the main warehouse. Ids are fixed so settings can point at them.
 */

export const MAIN_BRANCH_ID = 1
export const DEMO_EMPLOYEE_ID = 1
export const DEFAULT_CUSTOMER_ID = 1
export const DEMO_SHIFT_ID = 1
export const MAIN_TREASURY_ID = 1

export const DEMO_USER = { userName: "demo", email: "demo@takamulb.online", role: "SuperAdmin" }

export const defaultCustomer = {
  id: DEFAULT_CUSTOMER_ID,
  customerName: "عميل افتراضي",
  phone: null,
  address: null,
  countryName: "SA",
  isNational: false,
  isActive: true,
  balance: 0,
  openingBalance: 0,
  openingBalanceType: "Debit",
  openingBalanceDate: null,
  branchId: MAIN_BRANCH_ID,
  companions: [],
}

export const demoEmployee = {
  id: DEMO_EMPLOYEE_ID,
  firstName: "مستخدم تجريبي",
  lastName: "",
  mobile: "0500000000",
  branchId: MAIN_BRANCH_ID,
  userName: DEMO_USER.userName,
  email: DEMO_USER.email,
  roleName: DEMO_USER.role,
  isMultiBranch: true,
}

export const roles = [
  { id: 1, roleId: "1", roleName: "SuperAdmin", permissions: [] as string[] },
  { id: 2, roleId: "2", roleName: "كاشير", permissions: ["مبيعات.عرض", "مبيعات.إضافة", "المنتجات.عرض", "العملاء.عرض", "العملاء.إضافة"] },
]

export const units = [
  { id: 1, branchId: MAIN_BRANCH_ID, name: "حبة", description: null, taxCode: "PCE" },
  { id: 2, branchId: MAIN_BRANCH_ID, name: "كيلوجرام", description: null, taxCode: "KGM" },
  { id: 3, branchId: MAIN_BRANCH_ID, name: "لتر", description: null, taxCode: "LTR" },
]

export const taxes = [{ id: 1, name: "ضريبة القيمة المضافة", amount: 15 }]

export const exemptionReasons = [
  { id: 1, taxId: 1, taxExemptionReasonCode: "VATEX-SA-29", taxExemptionReasonText: "الخدمات المالية", isActive: true },
]

export const warehouses = [
  { id: 1, warehouseCode: "W1", warehouseName: "المستودع الرئيسي", address: null, city: null, state: null, capacity: null, managerName: null, branchId: MAIN_BRANCH_ID, isActive: true },
]

export const posDevices = [{ id: 1, deviceName: "جهاز نقطة البيع 1", branchId: MAIN_BRANCH_ID, status: "Active" }]

/** The one shift: opened today by the demo user, and it cannot be closed. */
export function demoShift(branchName: string) {
  const now = new Date()
  const pad = (v: number) => String(v).padStart(2, "0")
  return {
    id: DEMO_SHIFT_ID,
    shiftDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    startTime: "08:00:00",
    endDate: null,
    endTime: null,
    openingBalance: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalRevenues: 0,
    netTotal: 0,
    status: "Open",
    deviceId: "1",
    employeeName: demoEmployee.firstName,
    branchName,
    deviceName: posDevices[0].deviceName,
    branchId: MAIN_BRANCH_ID,
  }
}
