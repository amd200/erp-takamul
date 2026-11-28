import type { Profile } from "../types"
import { MAIN_BRANCH_ID, MAIN_TREASURY_ID } from "../../seed/common"
import { settings } from "./settings"
import { imagesIn } from "../images"

/**
 * PLACEHOLDER DATA: the categories, items, prices, images and cash boxes below only fill the screens until the real
 * restaurant data arrives. Images go in ./images and are named in `imageUrl` (e.g. "shawarma.webp"); no external links.
 */

const item = (id: number, categoryId: number, productNameAr: string, productNameEn: string, sellingPrice: number, costPrice: number, imageUrl: string | null = null) => ({
  id,
  productCode: 1000 + id,
  branchId: MAIN_BRANCH_ID,
  productType: "Direct",
  productNameAr,
  productNameEn,
  categoryId,
  barcode: String(6280000000000 + id),
  baseUnitId: 1,
  sellingPrice,
  costPrice,
  taxId: 1,
  // 2 = the price includes tax.
  taxCalculation: 2,
  minStockLevel: 1,
  balance: 100,
  isActive: true,
  showInSalesScreen: true,
  displayOrder: id,
  imageUrl,
  units: [],
})

export const restaurant: Profile = {
  id: "restaurant",
  title: "مطعم",
  branch: {
    id: MAIN_BRANCH_ID, code: "1", name: "المطعم - الفرع الرئيسي", nameEn: "Restaurant - Main Branch", shortName: "الفرع الرئيسي", shortNameEn: "Main",
    phone: "0110000000", commercialRegister: "1010000000", taxNumber: "300000000000003", footerNote: "شكرًا لزيارتكم",
    street: "طريق الملك فهد", district: "العليا", buildingNumber: "1234", subNumber: "5678", postalCode: "12211", cityName: "الرياض", stateName: "الرياض",
    locationAddress: null, organizationUnitName: "الفرع الرئيسي", industryBusinessCategory: "مطاعم", imageUrl: null, stampImageUrl: null, isActive: true,
  },
  categories: [
    { id: 1, categoryNameAr: "الوجبات الرئيسية", categoryNameEn: "Main dishes", displayOrder: 1 },
    { id: 2, categoryNameAr: "المقبلات", categoryNameEn: "Appetizers", displayOrder: 2 },
    { id: 3, categoryNameAr: "المشروبات الساخنة", categoryNameEn: "Hot drinks", displayOrder: 3 },
    { id: 4, categoryNameAr: "المشروبات الباردة", categoryNameEn: "Cold drinks", displayOrder: 4 },
    { id: 5, categoryNameAr: "الحلويات", categoryNameEn: "Desserts", displayOrder: 5 },
  ],
  products: [
    item(1, 1, "شاورما دجاج", "Chicken shawarma", 18, 8),
    item(2, 1, "برجر لحم", "Beef burger", 25, 11),
    item(3, 1, "دجاج مشوي", "Grilled chicken", 32, 15),
    item(4, 2, "حمص", "Hummus", 12, 4),
    item(5, 2, "بطاطس مقلية", "French fries", 9, 3),
    item(6, 2, "سلطة خضراء", "Green salad", 14, 5),
    item(7, 3, "قهوة عربية", "Arabic coffee", 8, 2),
    item(8, 3, "شاي", "Tea", 5, 1),
    item(9, 4, "عصير برتقال", "Orange juice", 12, 4),
    item(10, 4, "مياه معدنية", "Mineral water", 2, 0.75),
    item(11, 5, "كنافة", "Kunafa", 16, 6),
    item(12, 5, "أم علي", "Om Ali", 15, 5),
  ],
  treasuries: [
    { id: MAIN_TREASURY_ID, name: "الصندوق الرئيسي", openingBalance: 0, openingBalanceDate: null, currentBalance: 0, showInSalesScreen: true, branchId: MAIN_BRANCH_ID },
    { id: 2, name: "الشبكة", openingBalance: 0, openingBalanceDate: null, currentBalance: 0, showInSalesScreen: true, branchId: MAIN_BRANCH_ID },
  ],
  suppliers: [
    { id: 1, supplierName: "مورد افتراضي", phone: null, countryName: "SA", isNational: false, isActive: true, balance: 0, openingBalance: 0, openingBalanceType: "Credit", branchId: MAIN_BRANCH_ID },
  ],
  expenseItems: [
    { id: 1, name: "إيجار", isActive: true },
    { id: 2, name: "رواتب", isActive: true },
    { id: 3, name: "كهرباء ومياه", isActive: true },
  ],
  settings,
  images: imagesIn(import.meta.glob<string>("./images/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" })),
}
