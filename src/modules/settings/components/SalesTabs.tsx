import { useTranslation } from "react-i18next"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { fullName } from "@/modules/lookups/types"
import { useCustomers, useEmployees, useSuppliers, useTreasuries } from "@/modules/lookups/service"
import { Flag, Check, Section, Grid, Choice, useLabel, type FieldsProps } from "./fields"
import { A4Preview, AppearancePreview, BarcodePreview } from "./Previews"

/** The fields of each sales-settings tab, in the order the current system shows them. Names are the server's. */

export function GeneralFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  return (
    <Grid>
      <Flag control={control} name="generalTab.showReturnedItemsDetails" />
      <FormInput control={control} name="generalTab.rowsPerPage" type="number" required label={label("rowsPerPage")} />
      <Flag control={control} name="preparationTicketTab.showOrderDeviceNumber" />
      <Flag control={control} name="generalTab.enableDebitNote" />
    </Grid>
  )
}

export function SalonsFields({ form: { control, watch } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const { data: employees = [] } = useEmployees()
  return (
    <Grid>
      <Flag control={control} name="salonsTab.beautyTheme" />
      <Flag control={control} name="salonsTab.showServiceEmployeeSales" />
      <Flag control={control} name="salonsTab.showEmployeeService" />
      {watch("salonsTab.showEmployeeService") === true && (
        <FormSelect control={control} name="salonsTab.defaultServiceEmployeeId" numeric label={label("defaultServiceEmployeeId")} allowEmpty={t("common.none")}
          options={employees.map((e) => ({ value: String(e.id), label: fullName(e) }))} />
      )}
    </Grid>
  )
}

export function ShiftsFields({ form: { control } }: FieldsProps) {
  return (
    <Grid>
      <Flag control={control} name="shiftsTab.enableShiftStatement" />
      <Flag control={control} name="shiftsTab.showReturnsInShiftPrint" />
    </Grid>
  )
}

export function SaleScreenFields({ form: { control } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  return (
    <Grid>
      <Choice control={control} name="salesScreenTab.postype" values={["Pos1", "Pos2", "Pos3"]} />
      <FormSelect control={control} name="salesScreenTab.sales2InvoiceType" numeric required label={label("sales2InvoiceType")}
        options={[{ value: "2", label: t("settings.o.sales2InvoiceType.2") }, { value: "1", label: t("settings.o.sales2InvoiceType.1") }]} />
      <Flag control={control} name="salesScreenTab.selectOrderTypeDuringSave" />
      <Section title={t("settings.sec.customerOrders")}>
        <Flag control={control} name="salesScreenTab.selectTableNumberDuringSave" />
      </Section>
      <Section title={t("settings.sec.orderTypes")}>
        <Flag control={control} name="salesScreenTab.showOrdertype" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {["isTekawuy", "isTables", "isDelivary"].map((k) => <Check key={k} control={control} name={`salesScreenTab.${k}`} />)}
        </div>
      </Section>
      <Section title={t("settings.sec.itemEditTabs")} cols>
        {["isQuantity", "isPrice", "isAddons"].map((k) => <Check key={k} control={control} name={`salesScreenTab.${k}`} />)}
      </Section>
    </Grid>
  )
}

export function TicketFields({ form: { control } }: FieldsProps) {
  return (
    <Grid>
      <Flag control={control} name="generalTab.salesOrderStartNumber" />
      <Flag control={control} name="preparationTicketTab.showCustomerNameInPreparationTicket" />
      <Flag control={control} name="preparationTicketTab.showInvoiceNumberInPreparationTicket" />
      <Flag control={control} name="printRollTab.showBranchNameInPrint" />
      <Flag control={control} name="preparationTicketTab.saleBoneOrder" />
      <Flag control={control} name="preparationTicketTab.printPreparationTicketInPendingInvoices" />
      <Flag control={control} name="preparationTicketTab.printPreparedReceipt" />
    </Grid>
  )
}

export function PaymentFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  const { data: treasuries = [] } = useTreasuries()
  const options = treasuries.map((x) => ({ value: String(x.id), label: x.name }))
  return (
    <Grid>
      <Flag control={control} name="paymentTab.showPaymentMethods" />
      <Flag control={control} name="paymentTab.showPaidAndRemainingAmount" />
      <Choice control={control} name="paymentTab.paymentScreenType" values={["Type1", "Type2", "Type3"]} />
      <FormSelect control={control} name="sales.defaultPurchasesVault" numeric required label={label("defaultPurchasesVault")} options={options} />
      <FormSelect control={control} name="sales.defaultSalesVault" numeric required label={label("defaultSalesVault")} options={options} />
    </Grid>
  )
}

export function PreparationFields({ form: { control, watch } }: FieldsProps) {
  const label = useLabel()
  const on = watch("preparationScreenTab.enablePreparationScreen") === true
  return (
    <Grid>
      <Flag control={control} name="preparationScreenTab.enablePreparationScreen" />
      {on && <Flag control={control} name="preparationScreenTab.enablePreparationNotificationSound" />}
      {on && <Flag control={control} name="sales.showCustomaresSalsesOrder" />}
      {on && <FormInput control={control} name="preparationScreenTab.autoReadyOrderTimeInMinutes" type="number" required label={label("autoReadyOrderTimeInMinutes")} />}
    </Grid>
  )
}

export function AppearanceFields({ form: { control, watch } }: FieldsProps) {
  const label = useLabel()
  return (
    <>
      <Grid>
        {["itemNameSize", "itemPriceSize", "categorySize", "subItemNameSize", "subItemPriceSize"].map((k) => (
          <FormInput key={k} control={control} name={`appearanceTab.${k}`} type="number" required label={label(k)} />
        ))}
      </Grid>
      <div className="mt-5"><AppearancePreview v={watch("appearanceTab")} /></div>
    </>
  )
}

export function A4Fields({ form: { control, watch } }: FieldsProps) {
  return (
    <>
      <Grid>
        <Choice control={control} name="printA4Tab.a4InvoiceType" values={["Design1", "Design2", "Design3", "Design4"]} />
        <Flag control={control} name="printA4Tab.showHeaderAndFooterInPrint" />
      </Grid>
      <div className="mt-5"><A4Preview v={watch("printA4Tab")} /></div>
    </>
  )
}

export function RollFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  return (
    <Grid>
      <Flag control={control} name="printRollTab.invoiceDesign3" />
      <FormInput control={control} name="printRollTab.printCount" type="number" required label={label("printCount")} />
    </Grid>
  )
}

export function VoucherFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  return <Grid><FormInput control={control} name="vouchersPrintTab.voucherPrintCount" type="number" required label={label("voucherPrintCount")} /></Grid>
}

export function OperationsFields({ form: { control } }: FieldsProps) {
  return (
    <Grid>
      {["btnHolding", "whatsappSending", "emailSending", "isClaimVoucher", "isStockVoucher", "allowPrintA3", "allowExportExcel", "allowPrintInvoiceA4", "allowPrintInvoiceRoll",
        "allowViewInvoicePayments", "allowEditInvoiceNotes", "allowSalesReturn", "allowDownloadInvoicePdfA4", "allowDownloadInvoicePdfRoll"].map((k) => (
        <Flag key={k} control={control} name={`operationsTab.${k}`} />
      ))}
    </Grid>
  )
}

export function BarcodeFields({ form: { control, watch } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const scale = watch("barcodeScale.barcodeType") !== "None"
  return (
    <>
      <Grid>
        <FormSelect control={control} name="barcodeScale.barcodeType" required label={label("barcodeType")}
          options={["None", "ByWeight", "ByPrice"].map((o) => ({ value: o, label: t(`settings.o.barcodeType.${o}`) }))} />
        {scale && ["barcodeTotalCharacters", "barcodeFlagCharacters", "barcodeStartPosition", "barcodeCodeCharactersCount", "barcodeWeightStartPosition", "barcodeWeightCharactersCount", "barcodeDivideWeightBy"].map((k) => (
          <FormInput key={k} control={control} name={`barcodeScale.${k}`} type="number" required label={label(k)} />
        ))}
      </Grid>
      <div className="mt-5"><BarcodePreview v={watch("barcodeScale")} /></div>
    </>
  )
}

export function CustomersFields({ form: { control } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const { data: customers = [] } = useCustomers()
  return (
    <Grid>
      <FormSelect control={control} name="customersTab.defultCustomar" numeric required label={label("defultCustomar")} options={customers.map((c) => ({ value: String(c.id), label: c.customerName }))} />
      <Flag control={control} name="customersTab.showActualBalance" />
      <Flag control={control} name="customersTab.showCustomerNameAndPhoneOnlyInQuotations" on={t("settings.o.nameAndPhone.true")} off={t("settings.o.nameAndPhone.false")} />
    </Grid>
  )
}

export function SuppliersFields({ form: { control } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const { data: suppliers = [] } = useSuppliers()
  return (
    <Grid>
      <FormSelect control={control} name="suppliersTab.defaultSupplier" numeric required label={label("defaultSupplier")}
        options={[{ value: "0", label: t("common.none") }, ...suppliers.map((s) => ({ value: String(s.id), label: s.supplierName }))]} />
      <Flag control={control} name="suppliersTab.showActualSupplierBalance" />
      <Flag control={control} name="suppliersTab.showSupplierNameAndPhoneOnlyInPurchases" on={t("settings.o.nameAndPhone.true")} off={t("settings.o.nameAndPhone.false")} />
    </Grid>
  )
}

export function PurchasesScreenFields({ form: { control } }: FieldsProps) {
  return (
    <Grid>
      <Choice control={control} name="purchasesScreenTab.posPurcherstype" values={["POS1", "POS2"]} />
      <Flag control={control} name="purchasesScreenTab.purchesSetting" />
    </Grid>
  )
}

export function ItemsFields({ form: { control } }: FieldsProps) {
  return (
    <Grid>
      <Flag control={control} name="itemsTab.allowSaleWithZeroStock" />
      <Flag control={control} name="itemsTab.showCoastPrice" />
      <Flag control={control} name="itemsTab.showItemInOneLine" />
      {["enablePieceAndCartonSystem", "allowPriceChangeOnSale", "showProductBalanceAtSale", "showWarehouseItems", "showCostGreaterThanSalePriceMessage"].map((k) => (
        <Flag key={k} control={control} name={`itemsTab.${k}`} />
      ))}
    </Grid>
  )
}
