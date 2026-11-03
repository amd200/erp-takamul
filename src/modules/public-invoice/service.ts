import axios from "axios"
import { API_BASE_URL } from "@/shared/http/config"
import type { SalesOrderDto } from "@/modules/sales/types"

/**
 * Everything the customer's tracking page calls. The endpoints are anonymous, so a bare axios instance is used on
 * purpose: the app's client would try to refresh a session or sign somebody out on a 401.
 */
const publicClient = axios.create({ baseURL: API_BASE_URL })

/** `GET /public/invoices/last`: the sales order as /sales-orders sends it, plus the hold flags. */
export type LastInvoice = SalesOrderDto & { isHolding?: boolean | null; holdingOrderId?: number | null }

export type PushSubscriptionPayload = { endpoint: string; keys: { p256dh: string; auth: string } }

/** A held invoice has `isHolding: true`; once the cashier releases it, the final invoice has `false`. */
export const isFinalized = (invoice: LastInvoice) => invoice.isHolding === false

/** The id the customer follows and subscribes with: the held invoice's id (`holdingOrderId`, equal to `id` while held). */
export const followedInvoiceId = (invoice: LastInvoice) => invoice.holdingOrderId || invoice.id

export const publicInvoiceApi = {
  /**
   * Without `invoiceId` it is the branch's latest invoice; with the customer's own held id, that invoice (and, once
   * released, the final invoice made from it). Resolves to null on 404.
   */
  async last(branchId?: string, invoiceId?: number): Promise<LastInvoice | null> {
    try {
      const { data } = await publicClient.get<LastInvoice>("/public/invoices/last", { params: { branchId: branchId || undefined, invoiceId: invoiceId || undefined } })
      return data
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) return null
      throw e
    }
  },
  vapidPublicKey: async () => (await publicClient.get<{ publicKey: string }>("/push/vapid-public-key")).data.publicKey,
  subscribe: async (invoiceId: number, subscription: PushSubscriptionPayload) =>
    (await publicClient.post<{ id: number }>("/push/subscriptions", { invoiceId, subscription })).data,
}
