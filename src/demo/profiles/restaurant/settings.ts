import type { Settings } from "@/modules/settings/types"
import { DEFAULT_CUSTOMER_ID, MAIN_TREASURY_ID } from "../../seed/common"

/** PLACEHOLDER: the restaurant's real settings will replace these. Group and field names are the server's. */
export const settings: Settings = {
  generalTab: { showReturnedItemsDetails: true, rowsPerPage: 10, salesOrderStartNumber: false },
  paymentTab: { showPaymentMethods: true, showPaidAndRemainingAmount: true },
  shiftsTab: { enableShiftStatement: true, showReturnsInShiftPrint: true, showExpensesInShiftReport: true },
  printA4Tab: { showHeaderAndFooterInPrint: true },
  operationsTab: {
    btnHolding: true, whatsappSending: false, emailSending: false, isClaimVoucher: true, isStockVoucher: true, allowPrintA3: false,
    allowPrintInvoiceA4: true, allowPrintInvoiceRoll: true, allowViewInvoicePayments: true, allowEditInvoiceNotes: true, allowSalesReturn: true,
    allowDownloadInvoicePdfA4: true, allowDownloadInvoicePdfRoll: true, allowExportExcel: true, allowPrintInvoiceA5: false, enableDebitNote: false,
    allowResendInvoiceToZatca: false, allowViewZatcaResponse: false, allowDownloadZatcaResponseXml: false, allowDownloadZatcaResponseExcel: false,
  },
  tablesTab: { isTables: false, selectTableNumberDuringSave: false, showTableNumberInOrders: false },
  salonsTab: { beautyTheme: false, showEmployeeService: false, showServiceEmployeeSales: false, defaultServiceEmployeeId: null },
  printRollTab: { printCount: 1, showBranchNameInPrint: true, invoiceDesign3: false },
  salesScreenTab: { postype: "Pos1", isTekawuy: true, isTables: false, isDelivary: false, isQuantity: true, isPrice: true, isAddons: false, showOrdertype: true },
  customersTab: { defultCustomar: DEFAULT_CUSTOMER_ID, showActualBalance: true, showCustomerNameAndPhoneOnlyInQuotations: false },
  itemsTab: {
    allowSaleWithZeroStock: true, showItemInOneLine: false, showCostGreaterThanSalePriceMessage: true, showCoastPrice: true, showWarehouseItems: false,
    allowPriceChangeOnSale: false, enablePieceAndCartonSystem: false, showProductBalanceAtSale: false, defaultUnitId: 1, defaultCategoryId: 1,
  },
  suppliersTab: { showSupplierNameAndPhoneOnlyInPurchases: false, showActualSupplierBalance: true, defaultSupplier: 1 },
  notificationsTab: { enableNotifications: false },
  sales: { defaultSalesVault: MAIN_TREASURY_ID, defaultPurchasesVault: MAIN_TREASURY_ID, showCustomaresSalsesOrder: true },
  taxSetting: { taxSetting: "FirstStage" },
  tobaccoFees: { tobaccoFees: 0 },
}
