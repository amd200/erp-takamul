import { create } from "zustand"
import { CUSTOMERS, PRODUCTS, SAMPLE_ORDERS } from "./data"
import { MEASURE_KEYS, ORDER_STATUSES, type MeasureKey, type Measurements, type PayMethod, type ProductLine, type TailorCustomer, type TailorOrder, type TailorPiece } from "./types"

export const TAX_RATE = 0.15

export const emptyMeasurements = (): Measurements => Object.fromEntries(MEASURE_KEYS.map((k) => [k, ""])) as Measurements
export const filledCount = (m: Measurements) => MEASURE_KEYS.filter((k) => m[k] !== "").length

const priceOf = (productId: number) => PRODUCTS.find((p) => p.id === productId)?.price ?? 0
export const piecePrice = (p: TailorPiece) => priceOf(p.productId) * p.quantity
export const linePrice = (l: ProductLine) => priceOf(l.productId) * l.quantity

export function orderTotals(pieces: TailorPiece[], lines: ProductLine[]) {
  const subtotal = pieces.reduce((s, p) => s + piecePrice(p), 0) + lines.reduce((s, l) => s + linePrice(l), 0)
  const tax = subtotal * TAX_RATE
  return { subtotal, tax, total: subtotal + tax }
}

export const itemCount = (pieces: TailorPiece[], lines: ProductLine[]) => [...pieces, ...lines].reduce((n, p) => n + p.quantity, 0)

/** The number the next saved order will take. */
export const nextOrderNumber = (orders: TailorOrder[]) => `T-${1001 + orders.length}`

type Draft = {
  customer: TailorCustomer | null
  measurements: Measurements
  pieces: TailorPiece[]
  lines: ProductLine[]
  activeKey: string | null
  fitting: string
  delivery: string
  urgent: boolean
  note: string
  deposit: string
  method: PayMethod
}

type State = Draft & {
  orders: TailorOrder[]
  /** The shop's customers with their saved measurements; new ones are added here. */
  customers: TailorCustomer[]
  setCustomer: (c: TailorCustomer | null) => void
  /** Adds a new customer (with the measurements taken while adding them) and puts them on the order. */
  addCustomer: (c: Omit<TailorCustomer, "id">) => void
  setMeasure: (k: MeasureKey, v: string) => void
  resetMeasurements: (to: "saved" | "empty") => void
  /** A sewing product adds a piece; any other product adds a line, or one more of it. */
  addProduct: (productId: number) => void
  updatePiece: (key: string, patch: Partial<TailorPiece>) => void
  removePiece: (key: string) => void
  setLineQty: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  setActive: (key: string) => void
  set: (patch: Partial<Pick<Draft, "fitting" | "delivery" | "urgent" | "note" | "deposit" | "method">>) => void
  clear: () => void
  /** Puts the draft on the orders board and starts a new one; returns the new order's number. */
  saveOrder: () => string
  /** Moves an order to its next work status. */
  advance: (number: string) => void
}

const fresh = (): Draft => ({ customer: null, measurements: emptyMeasurements(), pieces: [], lines: [], activeKey: null, fitting: "", delivery: "", urgent: false, note: "", deposit: "", method: "cash" })

let seq = 0

/** The tailoring screen's draft order and its orders board, kept in memory only (no back end for tailoring yet). */
export const useTailoringStore = create<State>()((set, get) => ({
  ...fresh(),
  orders: SAMPLE_ORDERS,
  customers: CUSTOMERS,
  setCustomer: (c) => set({ customer: c, measurements: c ? { ...c.measurements } : emptyMeasurements() }),
  addCustomer: (c) => {
    const customer: TailorCustomer = { ...c, id: Date.now() }
    set((s) => ({ customers: [customer, ...s.customers], customer, measurements: { ...customer.measurements } }))
  },
  setMeasure: (k, v) => set((s) => ({ measurements: { ...s.measurements, [k]: v } })),
  resetMeasurements: (to) => set((s) => ({ measurements: to === "saved" && s.customer ? { ...s.customer.measurements } : emptyMeasurements() })),
  addProduct: (productId) => {
    const product = PRODUCTS.find((p) => p.id === productId)
    if (!product) return
    if (product.garment) {
      // The fabric and colour start as the last piece's, since one order is often all in one fabric.
      const last = get().pieces.at(-1)
      const piece: TailorPiece = {
        key: `p${++seq}`, productId, garment: product.garment, fabric: last?.fabric ?? "", color: last?.color ?? "", quantity: 1,
        style: { collar: "chinese", cuff: "single", pocket: "chest", placket: "hidden" }, note: "",
      }
      set((s) => ({ pieces: [...s.pieces, piece], activeKey: piece.key }))
      return
    }
    set((s) => {
      const have = s.lines.find((l) => l.productId === productId)
      return { lines: have ? s.lines.map((l) => (l === have ? { ...l, quantity: l.quantity + 1 } : l)) : [...s.lines, { key: `l${++seq}`, productId, quantity: 1 }] }
    })
  },
  updatePiece: (key, patch) => set((s) => ({ pieces: s.pieces.map((p) => (p.key === key ? { ...p, ...patch } : p)) })),
  removePiece: (key) => set((s) => {
    const pieces = s.pieces.filter((p) => p.key !== key)
    return { pieces, activeKey: s.activeKey === key ? (pieces.at(-1)?.key ?? null) : s.activeKey }
  }),
  setLineQty: (key, quantity) => set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)) })),
  removeLine: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
  setActive: (key) => set({ activeKey: key }),
  set: (patch) => set(patch),
  clear: () => set(fresh()),
  saveOrder: () => {
    const s = get()
    const { total } = orderTotals(s.pieces, s.lines)
    const number = nextOrderNumber(s.orders)
    const order: TailorOrder = {
      number, customer: s.customer?.name ?? "", phone: s.customer?.phone ?? "", pieces: itemCount(s.pieces, s.lines),
      total, paid: Math.min(Number(s.deposit) || 0, total), delivery: s.delivery, status: "new", urgent: s.urgent,
    }
    // The measurements stay on the customer, so their next order starts with these.
    const customers = s.customer ? s.customers.map((c) => (c.id === s.customer!.id ? { ...c, measurements: { ...s.measurements } } : c)) : s.customers
    set({ ...fresh(), orders: [order, ...s.orders], customers })
    return number
  },
  advance: (number) => set((s) => ({
    orders: s.orders.map((o) => {
      if (o.number !== number) return o
      const next = ORDER_STATUSES[ORDER_STATUSES.indexOf(o.status) + 1]
      return next ? { ...o, status: next, paid: next === "delivered" ? o.total : o.paid } : o
    }),
  })),
}))
