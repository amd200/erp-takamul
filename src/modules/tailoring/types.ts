export const GARMENT_IDS = ["thobe", "shirt", "pants", "bisht", "abaya", "suit"] as const
export type GarmentId = (typeof GARMENT_IDS)[number]

export const BODY_MEASURES = ["length", "shoulder", "chest", "waist", "hip", "sleeve", "neck", "armhole"] as const
export const DETAIL_MEASURES = ["cuff", "bottom", "chestPocket", "collarHeight"] as const
export const MEASURE_KEYS = [...BODY_MEASURES, ...DETAIL_MEASURES] as const
export type MeasureKey = (typeof MEASURE_KEYS)[number]
export type Measurements = Record<MeasureKey, string>

export const STYLE_OPTIONS = {
  collar: ["chinese", "classic", "round", "none"],
  cuff: ["single", "double", "button"],
  pocket: ["none", "chest", "side", "both"],
  placket: ["hidden", "visible", "zip"],
} as const
export type StyleKey = keyof typeof STYLE_OPTIONS
export type Style = { [K in StyleKey]: (typeof STYLE_OPTIONS)[K][number] }

export const PRODUCT_CATEGORIES = ["sewing", "ready", "head", "accessories"] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

/**
 * A product the shop sells. One with `garment` is sewn to order: adding it makes a piece that takes a fabric, the
 * customer's measurements and the cut details. Anything else is sold as it is.
 */
export type TailorProduct = { id: number; barcode: string; name: string; nameEn: string; price: number; category: ProductCategory; garment?: GarmentId }

/** One piece to sew on the order. The fabric and its colour are typed in by the cashier. */
export type TailorPiece = { key: string; productId: number; garment: GarmentId; fabric: string; color: string; quantity: number; style: Style; note: string }

/** A ready product on the order (sold as it is, no measurements). */
export type ProductLine = { key: string; productId: number; quantity: number }

export type TailorCustomer = { id: number; name: string; phone: string; measurements: Measurements }

export const ORDER_STATUSES = ["new", "cutting", "sewing", "ready", "delivered"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type TailorOrder = { number: string; customer: string; phone: string; pieces: number; total: number; paid: number; delivery: string; status: OrderStatus; urgent: boolean }

export type PayMethod = "cash" | "card"
