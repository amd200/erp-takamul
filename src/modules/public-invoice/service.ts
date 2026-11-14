import axios from "axios"
import { API_BASE_URL } from "@/shared/http/config"
import { http } from "@/shared/http/request"
import type { SalesOrderDto } from "@/modules/sales/types"
import type { OrderRequestDetails } from "@/modules/order-requests/types"
import type { Branch } from "@/modules/branches/types"
import type { Customer } from "@/modules/customers/types"

/**
 * Everything the customer's tracking page calls. The endpoints are anonymous, so a bare axios instance is used on
 * purpose: the app's client would try to refresh a session or sign somebody out on a 401.
 */
const publicClient = axios.create({ baseURL: API_BASE_URL })

/** A sales order as /sales-orders/{id} sends it: the hold flags, and the issuing branch and the customer for the receipt. */
export type PublicSalesOrder = SalesOrderDto & { isHolding?: boolean | null; holdingOrderId?: number | null; branch?: Branch | null; customer?: Customer | null }

/** `GET /public/invoices/last`: the latest record, a sales order or a customer's order request, in a typed envelope. */
export type LastInvoice =
  | { recordType: "SalesOrder"; data: PublicSalesOrder }
  | { recordType: "OrderRequest"; data: OrderRequestDetails }

/** What the visitor follows. Request ids and invoice ids are separate sequences, so an id never travels without its kind. */
export type FollowedRecord = { invoiceId: number; orderRequestId?: never } | { orderRequestId: number; invoiceId?: never }

export type PushSubscriptionPayload = { endpoint: string; keys: { p256dh: string; auth: string } }

export const recordKey = (r: FollowedRecord) => (r.orderRequestId ? `request-${r.orderRequestId}` : `invoice-${r.invoiceId}`)

/** A held invoice has `isHolding: true`; once the cashier releases it, the final invoice has `false`. A request is never final. */
export const isFinalized = (r: LastInvoice) => r.recordType === "SalesOrder" && r.data.isHolding === false

/** A request follows its own id; an invoice follows its held invoice's id (`holdingOrderId`, equal to `id` while held). */
export const followedRecord = (r: LastInvoice): FollowedRecord =>
  r.recordType === "OrderRequest" ? { orderRequestId: r.data.id } : { invoiceId: r.data.holdingOrderId || r.data.id }

export const publicInvoiceApi = {
  /** Without a target it is the branch's latest record; with one, that record (a released invoice comes back final). Null on 404. */
  async last(branchId?: string, target?: FollowedRecord): Promise<LastInvoice | null> {
    try {
      const { data } = await publicClient.get<LastInvoice>("/public/invoices/last", { params: { branchId: branchId || undefined, ...target } })
      return data
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) return null
      throw e
    }
  },
  vapidPublicKey: async () => (await publicClient.get<{ publicKey: string }>("/push/vapid-public-key")).data.publicKey,
  subscribe: async (target: FollowedRecord, subscription: PushSubscriptionPayload) =>
    (await publicClient.post<{ id: number }>("/push/subscriptions", { ...target, subscription })).data,
  /** The cashier's manual "your invoice is ready" push for a final invoice (signed in). 404 = no device subscribed. */
  send: (salesOrderId: number) => http<{ sent: number; failed?: number }>("/push/send", { method: "POST", data: { salesOrderId } }),
}
