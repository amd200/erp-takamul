/**
 * GET /Settings exactly as the server sends it: one object per settings tab, each saved whole with
 * PUT /Settings/tabs/<tab>, plus the older groups for the few settings no tab carries yet.
 * Enums are their names ("Pos1", "Type2", ...).
 */
type Enum = string | null

export type GeneralTab = { showReturnedItemsDetails: boolean; rowsPerPage: number; enableDebitNote: boolean; salesOrderStartNumber: boolean }
export type PaymentTab = { showPaymentMethods: boolean; showPaidAndRemainingAmount: boolean; paymentScreenType: Enum; mobilePaymentScreenType: Enum; posPurcherstype: Enum; postype: Enum }
export type ShiftsTab = { enableShiftStatement: boolean; showReturnsInShiftPrint: boolean }
export type PrintA4Tab = { showHeaderAndFooterInPrint: boolean; a4InvoiceType: Enum }
export type OperationsTab = {
  btnHolding: boolean; whatsappSending: boolean; emailSending: boolean; isClaimVoucher: boolean; isStockVoucher: boolean; allowPrintA3: boolean
  allowPrintInvoiceA4: boolean; allowPrintInvoiceRoll: boolean; allowViewInvoicePayments: boolean; allowEditInvoiceNotes: boolean; allowSalesReturn: boolean
  allowDownloadInvoicePdfA4: boolean; allowDownloadInvoicePdfRoll: boolean; allowExportExcel: boolean
}
export type TablesTab = { isTables: boolean; selectTableNumberDuringSave: boolean; showTableNumberInOrders: boolean }
export type SalonsTab = { beautyTheme: boolean; showEmployeeService: boolean; showServiceEmployeeSales: boolean; defaultServiceEmployeeId: number | null }
export type PrintRollTab = { printCount: number; showBranchNameInPrint: boolean; invoiceDesign3: boolean }
export type SalesScreenTab = {
  postype: Enum; sales2InvoiceType: number | null; selectOrderTypeDuringSave: boolean; selectTableNumberDuringSave: boolean; showOrdertype: boolean
  isTekawuy: boolean; isTables: boolean; isDelivary: boolean; isQuantity: boolean; isPrice: boolean; isAddons: boolean
}
export type PreparationTicketTab = {
  preparationTicketInvoiceType: Enum; showOrderDeviceNumber: boolean; showCustomerNameInPreparationTicket: boolean; showInvoiceNumberInPreparationTicket: boolean
  printPreparedReceipt: boolean; printPreparationTicketInPendingInvoices: boolean; saleBoneOrder: boolean
}
export type PreparationScreenTab = { enablePreparationScreen: boolean; enablePreparationNotificationSound: boolean; autoReadyOrderTimeInMinutes: number }
export type VouchersPrintTab = { voucherPrintCount: number }
export type PurchasesScreenTab = { posPurcherstype: Enum; purchesSetting: boolean }
export type CustomersTab = { defultCustomar: number; showActualBalance: boolean; showCustomerNameAndPhoneOnlyInQuotations: boolean }
export type ItemsTab = {
  allowSaleWithZeroStock: boolean; showItemInOneLine: boolean; showCostGreaterThanSalePriceMessage: boolean; showCoastPrice: boolean
  defaultUnitId: number | null; defaultCategoryId: number | null; showWarehouseItems: boolean; allowPriceChangeOnSale: boolean
  enablePieceAndCartonSystem: boolean; showProductBalanceAtSale: boolean; itemExpiry: boolean; enableSecondLanguageItemName: boolean
}
export type SuppliersTab = { showSupplierNameAndPhoneOnlyInPurchases: boolean }
export type AppearanceTab = { itemNameSize: number; itemPriceSize: number; categorySize: number; subItemNameSize: number; subItemPriceSize: number }

/** The older groups, only the fields the app reads from them. */
export type SalesGroup = { defaultSalesVault: number; defaultPurchasesVault: number; showCustomaresSalsesOrder: boolean }
export type PrintGroup = { defultPrinter: string | null; defultPreparedPrinter: string | null }
export type TaxGroup = { taxSetting: Enum }
export type TobaccoGroup = { tobaccoFees: number }
export type BarcodeGroup = {
  barcodeType: Enum; barcodeTotalCharacters: number; barcodeFlagCharacters: number | string; barcodeStartPosition: number; barcodeCodeCharactersCount: number
  barcodeWeightStartPosition: number | null; barcodeWeightCharactersCount: number; barcodeDivideWeightBy: number
}
export type WhatsAppGroup = Record<"whatsAppBusinessAccountId" | "whatsAppPhoneNumberId" | "whatsAppAppId" | "whatsAppAccessToken" | "whatsAppAppSecret" | "whatsAppTemplateName", string | null>

type Groups = {
  generalTab: GeneralTab; paymentTab: PaymentTab; shiftsTab: ShiftsTab; printA4Tab: PrintA4Tab; operationsTab: OperationsTab; tablesTab: TablesTab
  salonsTab: SalonsTab; printRollTab: PrintRollTab; salesScreenTab: SalesScreenTab; preparationTicketTab: PreparationTicketTab
  preparationScreenTab: PreparationScreenTab; vouchersPrintTab: VouchersPrintTab; purchasesScreenTab: PurchasesScreenTab; customersTab: CustomersTab
  itemsTab: ItemsTab; suppliersTab: SuppliersTab; appearanceTab: AppearanceTab
  sales: SalesGroup; print: PrintGroup; taxSetting: TaxGroup; tobaccoFees: TobaccoGroup; barcodeScale: BarcodeGroup; whatsApp: WhatsAppGroup
}
export type GroupKey = keyof Groups

/** Any group can be missing (an older server, or before the first answer), and so can any field in it. */
export type Settings = { [K in GroupKey]?: Partial<Groups[K]> }

export type SettingValue = boolean | number | string | null
