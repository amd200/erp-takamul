import type { ComponentType } from "react"
import { BellRing, Barcode, ChefHat, Clock, Coins, CreditCard, DollarSign, FileText, Grid3x3, Mail, MessageCircle, Monitor, Package, Percent, Printer, Receipt, Scissors, Send, ShoppingCart, SlidersHorizontal, Tag, Truck, Type, Users, type LucideIcon } from "lucide-react"
import type { ZodObject } from "zod"
import { P, type Permission } from "@/shared/permissions/permissions"
import type { FieldsProps } from "./components/fields"
import * as sales from "./components/SalesTabs"
import * as site from "./components/SiteTabs"
import * as s from "./schema"
import type { Values } from "./service"

/** The settings page tabs. The sales settings and the site settings are two pages, each in the old system's order. */
type Base = { id: string; page: "sales" | "system"; icon: LucideIcon; perm: Permission }
/** A tab drawn as a form: its schema, starting values and fields. */
export type FormTab = Base & { schema: ZodObject; empty: Values; Fields: ComponentType<FieldsProps> }
/** A tab drawn by its own screen (a plain list, or the ZATCA panel). */
export type Tab = Base | FormTab
export const isForm = (t: Tab): t is FormTab => "Fields" in t

export const TABS: Tab[] = [
  { id: "general", page: "sales", icon: SlidersHorizontal, perm: P.settings.sales, schema: s.generalSchema, empty: s.emptyGeneral, Fields: sales.GeneralFields },
  { id: "salons", page: "sales", icon: Scissors, perm: P.settings.sales, schema: s.salonsSchema, empty: s.emptySalons, Fields: sales.SalonsFields },
  { id: "shifts", page: "sales", icon: Clock, perm: P.settings.sales, schema: s.shiftsSchema, empty: s.emptyShifts, Fields: sales.ShiftsFields },
  { id: "sale", page: "sales", icon: Monitor, perm: P.settings.sales, schema: s.saleScreenSchema, empty: s.emptySaleScreen, Fields: sales.SaleScreenFields },
  { id: "invoice", page: "sales", icon: FileText, perm: P.settings.sales, schema: s.ticketSchema, empty: s.emptyTicket, Fields: sales.TicketFields },
  { id: "payment", page: "sales", icon: CreditCard, perm: P.settings.sales, schema: s.paymentSchema, empty: s.emptyPayment, Fields: sales.PaymentFields },
  { id: "preparation", page: "sales", icon: ChefHat, perm: P.settings.sales, schema: s.preparationSchema, empty: s.emptyPreparation, Fields: sales.PreparationFields },
  { id: "appearance", page: "sales", icon: Type, perm: P.settings.sales, schema: s.appearanceSchema, empty: s.emptyAppearance, Fields: sales.AppearanceFields },
  { id: "a4_printing", page: "sales", icon: Printer, perm: P.settings.printing, schema: s.a4Schema, empty: s.emptyA4, Fields: sales.A4Fields },
  { id: "roll_printing", page: "sales", icon: Receipt, perm: P.settings.printing, schema: s.rollSchema, empty: s.emptyRoll, Fields: sales.RollFields },
  { id: "voucher_printing", page: "sales", icon: Receipt, perm: P.settings.printing, schema: s.voucherSchema, empty: s.emptyVoucher, Fields: sales.VoucherFields },
  { id: "operations", page: "sales", icon: SlidersHorizontal, perm: P.settings.operations, schema: s.operationsSchema, empty: s.emptyOperations, Fields: sales.OperationsFields },
  { id: "barcode", page: "sales", icon: Barcode, perm: P.settings.barcode, schema: s.barcodeSchema, empty: s.emptyBarcode, Fields: sales.BarcodeFields },
  { id: "customers", page: "sales", icon: Users, perm: P.settings.partners, schema: s.customersSchema, empty: s.emptyCustomers, Fields: sales.CustomersFields },
  { id: "suppliers", page: "sales", icon: Truck, perm: P.settings.partners, schema: s.suppliersSchema, empty: s.emptySuppliers, Fields: sales.SuppliersFields },
  { id: "purchases_screen", page: "sales", icon: ShoppingCart, perm: P.settings.partners, schema: s.purchasesScreenSchema, empty: s.emptyPurchasesScreen, Fields: sales.PurchasesScreenFields },
  { id: "tables", page: "sales", icon: Grid3x3, perm: P.settings.sales },
  { id: "notifications", page: "sales", icon: BellRing, perm: P.settings.sales, schema: s.notificationsSchema, empty: s.emptyNotifications, Fields: sales.NotificationsFields },
  { id: "items", page: "sales", icon: Package, perm: P.settings.items, schema: s.itemsSchema, empty: s.emptyItems, Fields: sales.ItemsFields },
  { id: "pricing_systems", page: "sales", icon: DollarSign, perm: P.settings.sales },
  { id: "category_discounts", page: "sales", icon: Tag, perm: P.settings.sales },

  { id: "tobacco", page: "system", icon: Percent, perm: P.settings.company, schema: s.tobaccoSchema, empty: s.emptyTobacco, Fields: site.TobaccoFields },
  { id: "print_routing", page: "system", icon: Printer, perm: P.settings.printing, schema: s.printRoutingSchema, empty: s.emptyPrintRouting, Fields: site.PrintRoutingFields },
  { id: "delivery_companies", page: "system", icon: Truck, perm: P.settings.sales },
  { id: "currencies", page: "system", icon: Coins, perm: P.settings.sales },
  { id: "taxes", page: "system", icon: Percent, perm: P.settings.company },
  { id: "tax_system", page: "system", icon: Percent, perm: P.settings.company, schema: s.taxSystemSchema, empty: s.emptyTaxSystem, Fields: site.TaxSystemFields },
  { id: "tax_exemption_reasons", page: "system", icon: Percent, perm: P.settings.company },
  { id: "whatsapp", page: "system", icon: MessageCircle, perm: P.settings.integrations, schema: s.whatsappSchema, empty: s.emptyWhatsapp, Fields: site.WhatsappFields },
  { id: "email", page: "system", icon: Mail, perm: P.settings.integrations, schema: s.emailSchema, empty: s.emptyEmail, Fields: site.EmailFields },
  { id: "zatca", page: "system", icon: Send, perm: P.settings.zatca },
]
