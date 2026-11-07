import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { debitNotesApi, invoicesApi, returnsApi } from "./service"
import type { InvoiceQuery } from "./types"
import type { DebitNoteInput, InvoiceInput, Payment, ReturnInput } from "./types"

export const salesKeys = {
  invoices: ["sales", "invoices"] as const,
  invoice: (id: number) => ["sales", "invoices", id] as const,
  invoicePayments: (id: number) => ["sales", "invoices", id, "payments"] as const,
  returns: ["sales", "returns"] as const,
  debitNotes: ["sales", "debit-notes"] as const,
}

/** One page of an invoice list; the previous page stays on screen while the next loads. */
export const useInvoicePage = (q: InvoiceQuery) =>
  useQuery({ queryKey: [...salesKeys.invoices, "page", q] as const, queryFn: () => invoicesApi.page(q), placeholderData: keepPreviousData })
/** Recent invoices of both kinds, for the screens that pick one. */
export const useInvoices = () => useQuery({ queryKey: [...salesKeys.invoices, "recent"] as const, queryFn: invoicesApi.list })
/** One invoice, as the server sends it (items with what earlier returns took, payments, totals). */
export const useInvoice = (id: number | undefined) =>
  useQuery({ queryKey: salesKeys.invoice(id ?? 0), queryFn: () => invoicesApi.get(id!), enabled: !!id })
/** Payments (receipt vouchers) of one invoice. */
export const useInvoicePayments = (id: number | undefined) =>
  useQuery({ queryKey: salesKeys.invoicePayments(id ?? 0), queryFn: () => invoicesApi.payments(id!), enabled: !!id })
export const useReturns = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? [...salesKeys.returns, sort] : salesKeys.returns, queryFn: () => returnsApi.list(sort), placeholderData: keepPreviousData })
export const useDebitNotes = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? [...salesKeys.debitNotes, sort] : salesKeys.debitNotes, queryFn: () => debitNotesApi.list(sort), placeholderData: keepPreviousData })

// Any sales write can change invoices, returns and balances together, so each one refreshes the whole module (["sales"]).

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, key }: { input: InvoiceInput; key: string }) => invoicesApi.create(input, key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.invoiceSaved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, payment, key }: { invoiceId: number; payment: Omit<Payment, "id" | "date">; key: string }) =>
      invoicesApi.recordPayment(invoiceId, payment, key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.receiptSaved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: number) => invoicesApi.deletePayment(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useUpdateNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, notes }: { invoiceId: number; notes: string }) => invoicesApi.updateNotes(invoiceId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useSendInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoicesApi.sendToZatca(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.zatcaSent"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReturnInput) => returnsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.returnSaved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useSendReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => returnsApi.sendToZatca(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.zatcaSent"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useCreateDebitNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DebitNoteInput) => debitNotesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.debitSaved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useSendDebitNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => debitNotesApi.sendToZatca(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] })
      toast.success(i18n.t("sales.zatcaSent"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}
