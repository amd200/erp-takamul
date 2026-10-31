import { z } from "zod"

/**
 * One schema per settings page tab, like the other modules. Each is keyed by the server's own group and field names
 * (GET /Settings: `generalTab`, `paymentTab`, ...), so a form's values are saved back group by group. A tab may show
 * a field from another group when the old system did (`sales`, `print` and `local` are not tabs).
 */
const flag = z.boolean()
const count = (min: number, max: number) =>
  z.number({ error: "validation.number" }).int("validation.wholeNumber").min(min, { message: "validation.minValue" }).max(max, { message: "validation.maxValue" })
const id = z.number().nullable()
/** An enum, as the server sends it: its name ("Pos1", "Type2", ...). */
const named = z.string()
const text = z.string()

// ---- sales settings
export const generalSchema = z.object({
  generalTab: z.object({ showReturnedItemsDetails: flag, rowsPerPage: count(5, 100), enableDebitNote: flag }),
  preparationTicketTab: z.object({ showOrderDeviceNumber: flag }),
})
export const emptyGeneral: z.infer<typeof generalSchema> = {
  generalTab: { showReturnedItemsDetails: true, rowsPerPage: 10, enableDebitNote: true },
  preparationTicketTab: { showOrderDeviceNumber: false },
}

export const salonsSchema = z.object({
  salonsTab: z.object({ beautyTheme: flag, showServiceEmployeeSales: flag, showEmployeeService: flag, defaultServiceEmployeeId: id }),
})
export const emptySalons: z.infer<typeof salonsSchema> = {
  salonsTab: { beautyTheme: false, showServiceEmployeeSales: false, showEmployeeService: false, defaultServiceEmployeeId: null },
}

export const shiftsSchema = z.object({ shiftsTab: z.object({ showReturnsInShiftPrint: flag }) })
export const emptyShifts: z.infer<typeof shiftsSchema> = { shiftsTab: { showReturnsInShiftPrint: true } }

export const saleScreenSchema = z.object({
  salesScreenTab: z.object({
    postype: named, sales2InvoiceType: z.number().nullable(), selectOrderTypeDuringSave: flag, selectTableNumberDuringSave: flag, showOrdertype: flag,
    isTekawuy: flag, isTables: flag, isDelivary: flag, isQuantity: flag, isPrice: flag, isAddons: flag,
  }),
})
export const emptySaleScreen: z.infer<typeof saleScreenSchema> = {
  salesScreenTab: {
    postype: "Pos1", sales2InvoiceType: 2, selectOrderTypeDuringSave: false, selectTableNumberDuringSave: false, showOrdertype: true,
    isTekawuy: true, isTables: true, isDelivary: false, isQuantity: true, isPrice: true, isAddons: true,
  },
}

export const ticketSchema = z.object({
  generalTab: z.object({ salesOrderStartNumber: flag }),
  preparationTicketTab: z.object({
    showCustomerNameInPreparationTicket: flag, showInvoiceNumberInPreparationTicket: flag, saleBoneOrder: flag,
    printPreparationTicketInPendingInvoices: flag, printPreparedReceipt: flag,
  }),
  printRollTab: z.object({ showBranchNameInPrint: flag }),
})
export const emptyTicket: z.infer<typeof ticketSchema> = {
  generalTab: { salesOrderStartNumber: true },
  preparationTicketTab: {
    showCustomerNameInPreparationTicket: false, showInvoiceNumberInPreparationTicket: true, saleBoneOrder: false,
    printPreparationTicketInPendingInvoices: false, printPreparedReceipt: true,
  },
  printRollTab: { showBranchNameInPrint: false },
}

export const paymentSchema = z.object({
  paymentTab: z.object({ showPaymentMethods: flag, showPaidAndRemainingAmount: flag, paymentScreenType: named }),
  sales: z.object({ defaultPurchasesVault: id, defaultSalesVault: id }),
})
export const emptyPayment: z.infer<typeof paymentSchema> = {
  paymentTab: { showPaymentMethods: true, showPaidAndRemainingAmount: true, paymentScreenType: "Type2" },
  sales: { defaultPurchasesVault: null, defaultSalesVault: null },
}

export const preparationSchema = z.object({
  preparationScreenTab: z.object({ enablePreparationScreen: flag, enablePreparationNotificationSound: flag, autoReadyOrderTimeInMinutes: count(0, 240) }),
  sales: z.object({ showCustomaresSalsesOrder: flag }),
})
export const emptyPreparation: z.infer<typeof preparationSchema> = {
  preparationScreenTab: { enablePreparationScreen: false, enablePreparationNotificationSound: true, autoReadyOrderTimeInMinutes: 0 },
  sales: { showCustomaresSalsesOrder: false },
}

export const appearanceSchema = z.object({
  appearanceTab: z.object({ itemNameSize: count(1, 99), itemPriceSize: count(1, 99), categorySize: count(1, 99), subItemNameSize: count(1, 99), subItemPriceSize: count(1, 99) }),
})
export const emptyAppearance: z.infer<typeof appearanceSchema> = {
  appearanceTab: { itemNameSize: 12, itemPriceSize: 12, categorySize: 14, subItemNameSize: 12, subItemPriceSize: 12 },
}

export const a4Schema = z.object({ printA4Tab: z.object({ a4InvoiceType: named, showHeaderAndFooterInPrint: flag }) })
export const emptyA4: z.infer<typeof a4Schema> = { printA4Tab: { a4InvoiceType: "Design1", showHeaderAndFooterInPrint: true } }

export const rollSchema = z.object({ printRollTab: z.object({ invoiceDesign3: flag, printCount: count(1, 5) }) })
export const emptyRoll: z.infer<typeof rollSchema> = { printRollTab: { invoiceDesign3: false, printCount: 1 } }

export const voucherSchema = z.object({ vouchersPrintTab: z.object({ voucherPrintCount: count(1, 5) }) })
export const emptyVoucher: z.infer<typeof voucherSchema> = { vouchersPrintTab: { voucherPrintCount: 1 } }

export const operationsSchema = z.object({
  operationsTab: z.object({
    btnHolding: flag, whatsappSending: flag, emailSending: flag, isClaimVoucher: flag, isStockVoucher: flag, allowPrintA3: flag, allowExportExcel: flag,
    allowPrintInvoiceA4: flag, allowPrintInvoiceRoll: flag, allowViewInvoicePayments: flag, allowEditInvoiceNotes: flag, allowSalesReturn: flag,
    allowDownloadInvoicePdfA4: flag, allowDownloadInvoicePdfRoll: flag,
  }),
})
export const emptyOperations: z.infer<typeof operationsSchema> = {
  operationsTab: {
    btnHolding: true, whatsappSending: true, emailSending: true, isClaimVoucher: false, isStockVoucher: false, allowPrintA3: true, allowExportExcel: true,
    allowPrintInvoiceA4: true, allowPrintInvoiceRoll: true, allowViewInvoicePayments: true, allowEditInvoiceNotes: true, allowSalesReturn: true,
    allowDownloadInvoicePdfA4: true, allowDownloadInvoicePdfRoll: true,
  },
}

export const barcodeSchema = z.object({
  barcodeScale: z.object({
    barcodeType: text, barcodeTotalCharacters: count(8, 20), barcodeFlagCharacters: count(0, 999999), barcodeStartPosition: count(1, 20),
    barcodeCodeCharactersCount: count(1, 10), barcodeWeightStartPosition: count(1, 20), barcodeWeightCharactersCount: count(1, 10), barcodeDivideWeightBy: count(1, 100000),
  }),
})
export const emptyBarcode: z.infer<typeof barcodeSchema> = {
  barcodeScale: {
    barcodeType: "ByWeight", barcodeTotalCharacters: 13, barcodeFlagCharacters: 27, barcodeStartPosition: 1,
    barcodeCodeCharactersCount: 5, barcodeWeightStartPosition: 8, barcodeWeightCharactersCount: 5, barcodeDivideWeightBy: 1000,
  },
}

export const customersSchema = z.object({
  customersTab: z.object({ defultCustomar: id, showActualBalance: flag, showCustomerNameAndPhoneOnlyInQuotations: flag }),
})
export const emptyCustomers: z.infer<typeof customersSchema> = {
  customersTab: { defultCustomar: null, showActualBalance: true, showCustomerNameAndPhoneOnlyInQuotations: false },
}

export const suppliersSchema = z.object({ suppliersTab: z.object({ showSupplierNameAndPhoneOnlyInPurchases: flag }) })
export const emptySuppliers: z.infer<typeof suppliersSchema> = { suppliersTab: { showSupplierNameAndPhoneOnlyInPurchases: false } }

export const purchasesScreenSchema = z.object({ purchasesScreenTab: z.object({ posPurcherstype: named, purchesSetting: flag }) })
export const emptyPurchasesScreen: z.infer<typeof purchasesScreenSchema> = { purchasesScreenTab: { posPurcherstype: "POS1", purchesSetting: false } }

export const itemsSchema = z.object({
  itemsTab: z.object({
    allowSaleWithZeroStock: flag, showCoastPrice: flag, showItemInOneLine: flag, defaultCategoryId: id, defaultUnitId: id,
    enablePieceAndCartonSystem: flag, allowPriceChangeOnSale: flag, showProductBalanceAtSale: flag, enableSecondLanguageItemName: flag,
    itemExpiry: flag, showWarehouseItems: flag, showCostGreaterThanSalePriceMessage: flag,
  }),
})
export const emptyItems: z.infer<typeof itemsSchema> = {
  itemsTab: {
    allowSaleWithZeroStock: false, showCoastPrice: false, showItemInOneLine: false, defaultCategoryId: null, defaultUnitId: null,
    enablePieceAndCartonSystem: true, allowPriceChangeOnSale: true, showProductBalanceAtSale: true, enableSecondLanguageItemName: true,
    itemExpiry: false, showWarehouseItems: false, showCostGreaterThanSalePriceMessage: true,
  },
}

// ---- site settings
export const tobaccoSchema = z.object({ tobaccoFees: z.object({ tobaccoFees: z.number({ error: "validation.number" }).min(0, "validation.min0").max(100, "validation.percentMax") }) })
export const emptyTobacco: z.infer<typeof tobaccoSchema> = { tobaccoFees: { tobaccoFees: 0 } }

export const printRoutingSchema = z.object({ print: z.object({ defultPrinter: z.string().nullable(), defultPreparedPrinter: z.string().nullable() }) })
export const emptyPrintRouting: z.infer<typeof printRoutingSchema> = { print: { defultPrinter: null, defultPreparedPrinter: null } }

export const taxSystemSchema = z.object({ taxSetting: z.object({ taxSetting: named }) })
export const emptyTaxSystem: z.infer<typeof taxSystemSchema> = { taxSetting: { taxSetting: "SecondStage" } }

export const whatsappSchema = z.object({
  whatsApp: z.object({
    whatsAppBusinessAccountId: text, whatsAppPhoneNumberId: text, whatsAppAppId: text, whatsAppAccessToken: text, whatsAppAppSecret: text, whatsAppTemplateName: text,
  }),
})
export const emptyWhatsapp: z.infer<typeof whatsappSchema> = {
  whatsApp: {
    whatsAppBusinessAccountId: "", whatsAppPhoneNumberId: "", whatsAppAppId: "", whatsAppAccessToken: "", whatsAppAppSecret: "", whatsAppTemplateName: "invoice_ready",
  },
}

/** The mail server has no field on the server; `local` is kept in this browser. */
export const emailSchema = z.object({
  local: z.object({ smtpHost: text, smtpPort: count(1, 65535), smtpEncryption: text, smtpUser: text, smtpPassword: text }),
})
export const emptyEmail: z.infer<typeof emailSchema> = {
  local: { smtpHost: "smtp.office365.com", smtpPort: 587, smtpEncryption: "TLS", smtpUser: "invoices@takamul.sa", smtpPassword: "" },
}
