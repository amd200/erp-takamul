import { create } from "zustand"
import { quoteLineOf } from "@/modules/quotes/schema"
import { quoteGlobalDiscount } from "@/modules/quotes/service"
import { createJSONStorage, persist } from "zustand/middleware"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { useAuthStore } from "@/shared/auth/authStore"
import { newIdempotencyKey } from "@/shared/http/idempotency"
import type { SelectedMeasurement } from "@/modules/customers/types"
import type { Quote } from "@/modules/quotes/types"
import { settingsApi } from "@/modules/settings/service"
import { newLineKey, sameLine } from "./cart"
import type { CartDiscount, CartLine, DineInMode, OrderType } from "./types"

/**
 * The sale being rung up. While a save is in flight, or its outcome is unknown (the connection dropped),
 * the cart is locked and keeps the same key and date, so sending it again saves the sale once.
 * Only such an unconfirmed sale survives a reload; an ordinary cart starts empty.
 */
type SaveState = "idle" | "saving" | "uncertain"

type PosState = {
  lines: CartLine[]
  orderType: OrderType
  /** The label picked before paying (takeaway / dine-in / delivery) when the branch asks for it; shown on prints, it does not change the sale. */
  orderTypeName: string | null
  /** The pager the customer takes, and the table number asked before paying; both are only labels on the sale. */
  orderDeviceNumber: string | null
  tableNumber: string | null
  /** Dine-in: the table picked, what the cart is doing with it, and the table's open order (add-items and checkout). */
  tableId: number | null
  dineInMode: DineInMode | null
  dineInOrderId: number | null
  /** Add-items: the open order's number and the lines it had when opened, so the kitchen ticket shows only what was added. */
  dineInOrderNumber: string | null
  originalLines: CartLine[]
  customerId: number | null
  customerName: string
  /** Whose eye measurements go on this invoice; cleared when the customer changes. */
  selectedMeasurement: SelectedMeasurement | null
  deliveryCompanyId: number | null
  employeeId: number | null
  discount: CartDiscount
  note: string
  /** Set when the cart came from a held order that is being released. */
  holdingOrderId: number | null
  save: SaveState
  key: string | null
  orderDate: string | null
  ownerId: string | null

  add: (line: Omit<CartLine, "key" | "notes" | "extras"> & Partial<Pick<CartLine, "notes" | "extras">>) => void
  setQty: (key: string, quantity: number) => void
  patchLine: (key: string, patch: Partial<CartLine>) => void
  remove: (key: string) => void
  setOrderType: (t: OrderType) => void
  setOrderTypeName: (name: string | null) => void
  setOrderDeviceNumber: (n: string | null) => void
  setTableNumber: (n: string | null) => void
  setTable: (id: number | null) => void
  /** Starts a dine-in sale on a table: an empty cart for a new order, or the table's open order to add to / to pay. */
  startDineIn: (d: { mode: DineInMode; tableId: number; orderId: number | null; orderNumber?: string | null; lines?: CartLine[]; customerId?: number | null; customerName?: string; note?: string; orderDeviceNumber?: string | null; employeeId?: number | null }) => boolean
  setCustomer: (id: number | null, name: string) => void
  setMeasurement: (m: SelectedMeasurement | null) => void
  setDeliveryCompany: (id: number | null) => void
  setEmployee: (id: number | null) => void
  setDiscount: (d: CartDiscount) => void
  setNote: (n: string) => void
  loadHeld: (id: number, lines: CartLine[], customerId: number | null, customerName: string, note: string) => boolean
  /** Starts a new sale from a quotation; a locked sale cannot be replaced. */
  loadQuotation: (quote: Quote) => boolean
  /** Called right before sending: fixes the key and date so a retry sends the same sale. */
  beginSave: (ownerId: string | null, today: string) => { key: string; orderDate: string }
  /** The server answered with a refusal, so nothing was saved and the key can go. */
  saveRejected: () => void
  /** No answer: the sale may or may not exist, so keep the key and lock the cart. */
  saveUncertain: () => void
  /** Drops an unconfirmed sale after the cashier checked the invoices and it was not saved. */
  discardPending: () => void
  clear: () => void
}

const empty = { lines: [] as CartLine[], discount: { kind: "value", value: 0 } as CartDiscount, note: "", selectedMeasurement: null as SelectedMeasurement | null, orderTypeName: null as string | null, orderDeviceNumber: null as string | null, tableNumber: null as string | null, tableId: null as number | null, dineInMode: null as DineInMode | null, dineInOrderId: null as number | null, dineInOrderNumber: null as string | null, originalLines: [] as CartLine[], holdingOrderId: null, save: "idle" as SaveState, key: null, orderDate: null, ownerId: null }

export const usePosStore = create<PosState>()(persist((set, get) => {
  const locked = () => get().save !== "idle"
  return {
    ...empty,
    orderType: "TakeAway",
    customerId: null,
    customerName: "",
    deliveryCompanyId: null,
    employeeId: null,

    add: (line) => {
      if (locked()) return
      const next: CartLine = { notes: "", extras: [], ...line, key: newLineKey() }
      set((s) => {
        // With "add repeated item as a new line" on, the same item is never merged into an existing line.
        const same = settingsApi.snapshot().itemsTab?.showItemInOneLine ? undefined : s.lines.find((l) => sameLine(l, next))
        return same
          ? { lines: s.lines.map((l) => (l.key === same.key ? { ...l, quantity: l.quantity + next.quantity } : l)) }
          : { lines: [...s.lines, next] }
      })
    },
    setQty: (key, quantity) => {
      if (locked()) return
      set((s) => ({ lines: quantity <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l)) }))
    },
    patchLine: (key, patch) => { if (!locked()) set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) })) },
    remove: (key) => { if (!locked()) set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })) },
    setOrderType: (orderType) => { if (!locked()) set({ orderType }) },
    setOrderTypeName: (orderTypeName) => { if (!locked()) set({ orderTypeName }) },
    setOrderDeviceNumber: (orderDeviceNumber) => { if (!locked()) set({ orderDeviceNumber }) },
    setTableNumber: (tableNumber) => { if (!locked()) set({ tableNumber }) },
    setTable: (tableId) => { if (!locked()) set({ tableId }) },
    startDineIn: (d) => {
      if (locked()) return false
      set((s) => ({
        ...empty, orderType: "InDine", deliveryCompanyId: null, employeeId: d.employeeId ?? s.employeeId,
        dineInMode: d.mode, tableId: d.tableId, dineInOrderId: d.orderId, dineInOrderNumber: d.orderNumber ?? null, originalLines: d.lines ?? [], lines: d.lines ?? [],
        customerId: d.customerId !== undefined ? d.customerId : s.customerId, customerName: d.customerId !== undefined ? d.customerName ?? "" : s.customerName,
        note: d.note ?? "", orderDeviceNumber: d.orderDeviceNumber ?? null,
      }))
      return true
    },
    setCustomer: (customerId, customerName) => { if (!locked()) set((s) => ({ customerId, customerName, selectedMeasurement: s.customerId === customerId ? s.selectedMeasurement : null })) },
    setMeasurement: (selectedMeasurement) => { if (!locked()) set({ selectedMeasurement }) },
    setDeliveryCompany: (deliveryCompanyId) => { if (!locked()) set({ deliveryCompanyId }) },
    setEmployee: (employeeId) => { if (!locked()) set({ employeeId }) },
    setDiscount: (discount) => { if (!locked()) set({ discount }) },
    setNote: (note) => { if (!locked()) set({ note }) },
    loadHeld: (holdingOrderId, lines, customerId, customerName, note) => {
      if (locked()) return false
      set({ ...empty, lines, holdingOrderId, customerId, customerName, note })
      return true
    },
    loadQuotation: (quote) => {
      if (locked() || (quote.items ?? []).length === 0) return false
      set({
        ...empty,
        orderType: "TakeAway", deliveryCompanyId: null, employeeId: null,
        lines: (quote.items ?? []).map((item) => ({ ...quoteLineOf(item), amounts: undefined, key: newLineKey(), notes: "", extras: [], imageUrl: null })),
        customerId: quote.customerid || null, customerName: quote.customerName ?? "", note: quote.notes ?? "",
        discount: { kind: "value", value: quoteGlobalDiscount(quote) },
      })
      return true
    },

    beginSave: (ownerId, today) => {
      const s = get()
      const key = s.key ?? newIdempotencyKey()
      const orderDate = s.key ? s.orderDate ?? today : today
      set({ save: "saving", key, orderDate, ownerId })
      return { key, orderDate }
    },
    saveRejected: () => set({ save: "idle", key: null, orderDate: null, ownerId: null }),
    saveUncertain: () => set({ save: "uncertain" }),
    discardPending: () => set({ ...empty }),
    clear: () => set({ ...empty }),
  }
}, {
  name: "pos-pending-sale",
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => (s.save !== "idle" && s.key
    ? { lines: s.lines, orderType: s.orderType, orderTypeName: s.orderTypeName, orderDeviceNumber: s.orderDeviceNumber, tableNumber: s.tableNumber, tableId: s.tableId, dineInMode: s.dineInMode, dineInOrderId: s.dineInOrderId, dineInOrderNumber: s.dineInOrderNumber, originalLines: s.originalLines, customerId: s.customerId, customerName: s.customerName, deliveryCompanyId: s.deliveryCompanyId, employeeId: s.employeeId, discount: s.discount, note: s.note, selectedMeasurement: s.selectedMeasurement, holdingOrderId: s.holdingOrderId, key: s.key, orderDate: s.orderDate, ownerId: s.ownerId }
    : {}),
  // A sale that was in flight when the page closed has an unknown outcome too.
  merge: (persisted, current) => {
    const p = persisted as Partial<PosState> | undefined
    return p?.key ? { ...current, ...p, save: "uncertain" } : current
  },
}))

/** The companion whose measurement is on the sale; undefined when the customer's own (or no) measurement is picked. */
export function getCustomerCompanionId(): number | undefined {
  const { selectedMeasurement: m, customerId } = usePosStore.getState()
  return m?.source === "companion" && m.customerId === customerId ? m.companionId : undefined
}

/** An unconfirmed sale belongs to the user who sent it; another user signing in on this device does not take it over. */
const dropOthersSale = (userId: string | null | undefined) => {
  const s = usePosStore.getState()
  if (!userId || !s.key || !s.ownerId || s.ownerId === userId) return
  s.discardPending()
  toast.warning(i18n.t("pos.othersSaleDropped"))
}
dropOthersSale(useAuthStore.getState().session?.userId)
useAuthStore.subscribe((a, prev) => { if (a.session?.userId !== prev.session?.userId) dropOthersSale(a.session?.userId) })
