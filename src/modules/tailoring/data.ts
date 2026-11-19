import type { Measurements, ProductCategory, TailorCustomer, TailorOrder, TailorProduct } from "./types"

/**
 * Sample data for the tailoring screen. The back end has no tailoring data yet (no measurements, fabrics or work
 * statuses), so the screen is a look-only prototype running on these.
 */
const code = (id: number) => `62810000${String(id).padStart(4, "0")}`
const sewing = (id: number, garment: NonNullable<TailorProduct["garment"]>, name: string, nameEn: string, price: number): TailorProduct =>
  ({ id, barcode: code(id), name, nameEn, price, category: "sewing", garment })
const ready = (id: number, category: ProductCategory, name: string, nameEn: string, price: number): TailorProduct =>
  ({ id, barcode: code(id), name, nameEn, price, category })

/** The shop's products: sewing services that make a piece, and ready goods sold as they are. */
export const PRODUCTS: TailorProduct[] = [
  sewing(1, "thobe", "تفصيل ثوب", "Thobe tailoring", 120),
  sewing(2, "shirt", "تفصيل قميص", "Shirt tailoring", 80),
  sewing(3, "pants", "تفصيل سروال", "Sirwal tailoring", 60),
  sewing(4, "bisht", "تفصيل بشت", "Bisht tailoring", 350),
  sewing(5, "abaya", "تفصيل عباية", "Abaya tailoring", 150),
  sewing(6, "suit", "تفصيل بدلة", "Suit tailoring", 450),
  ready(11, "ready", "ثوب جاهز", "Ready thobe", 180),
  ready(12, "ready", "سروال قطن", "Cotton sirwal", 35),
  ready(13, "ready", "فانيلة داخلية", "Undershirt", 25),
  ready(14, "ready", "بيجامة قطن", "Cotton pyjamas", 95),
  ready(21, "head", "شماغ أحمر", "Red shemagh", 120),
  ready(22, "head", "غترة بيضاء", "White ghutra", 85),
  ready(23, "head", "عقال أسود", "Black agal", 60),
  ready(24, "head", "طاقية", "Taqiyah cap", 15),
  ready(31, "accessories", "كبك فضة", "Silver cufflinks", 45),
  ready(32, "accessories", "طقم أزرار صدف", "Shell buttons set", 20),
  ready(33, "accessories", "مسباح", "Prayer beads", 40),
  ready(34, "accessories", "حزام جلد", "Leather belt", 70),
]

const m = (v: number[]): Measurements => {
  const [length, shoulder, chest, waist, hip, sleeve, neck, armhole, cuff, bottom, chestPocket, collarHeight] = v.map(String)
  return { length, shoulder, chest, waist, hip, sleeve, neck, armhole, cuff, bottom, chestPocket, collarHeight }
}

export const CUSTOMERS: TailorCustomer[] = [
  { id: 1, name: "محمد العتيبي", phone: "0551234567", measurements: m([148, 47, 108, 98, 110, 62, 41, 50, 24, 74, 20, 4]) },
  { id: 2, name: "عبدالله القحطاني", phone: "0569876543", measurements: m([152, 49, 114, 104, 116, 64, 43, 52, 25, 78, 21, 4]) },
  { id: 3, name: "سارة الشهري", phone: "0503344556", measurements: m([140, 39, 92, 78, 100, 58, 35, 44, 20, 90, 0, 3]) },
  { id: 4, name: "خالد الدوسري", phone: "0547788990", measurements: m([150, 48, 110, 100, 112, 63, 42, 51, 24, 76, 20, 4]) },
]

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const SAMPLE_ORDERS: TailorOrder[] = [
  { number: "T-1001", customer: "محمد العتيبي", phone: "0551234567", pieces: 3, total: 586.5, paid: 300, delivery: day(-1), status: "sewing", urgent: false },
  { number: "T-1002", customer: "عبدالله القحطاني", phone: "0569876543", pieces: 1, total: 414, paid: 414, delivery: day(0), status: "ready", urgent: true },
  { number: "T-1003", customer: "سارة الشهري", phone: "0503344556", pieces: 2, total: 690, paid: 200, delivery: day(3), status: "cutting", urgent: false },
  { number: "T-1004", customer: "خالد الدوسري", phone: "0547788990", pieces: 4, total: 1104, paid: 500, delivery: day(5), status: "new", urgent: false },
  { number: "T-1005", customer: "فهد الحربي", phone: "0532211445", pieces: 2, total: 460, paid: 460, delivery: day(-3), status: "delivered", urgent: false },
  { number: "T-1006", customer: "نورة السبيعي", phone: "0598877665", pieces: 1, total: 345, paid: 150, delivery: day(1), status: "ready", urgent: false },
]
