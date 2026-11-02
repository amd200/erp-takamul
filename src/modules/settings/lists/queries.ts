import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { currenciesApi, deliveryApi, discountsApi, pricingApi, reasonsApi, tablesApi, taxesListApi } from "./service"

export const currencyKeys = { all: ["settings-currencies"] as const, list: () => ["settings-currencies", "list"] as const }

export const useDelivery = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-delivery", "list", sort] : ["settings-delivery", "list"], queryFn: () => deliveryApi.list(sort), placeholderData: keepPreviousData })

export const useSaveDelivery = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof deliveryApi.create>[0] }) => (id ? deliveryApi.update(id, data) : deliveryApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-delivery"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteDelivery = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deliveryApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-delivery"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useCurrencies = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-currencies", "list", sort] : ["settings-currencies", "list"], queryFn: () => currenciesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveCurrency = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof currenciesApi.create>[0] }) => (id ? currenciesApi.update(id, data) : currenciesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-currencies"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteCurrency = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => currenciesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-currencies"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useTaxList = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-taxes", "list", sort] : ["settings-taxes", "list"], queryFn: () => taxesListApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTax = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof taxesListApi.create>[0] }) => (id ? taxesListApi.update(id, data) : taxesListApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-taxes"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteTax = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => taxesListApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-taxes"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useReasons = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-reasons", "list", sort] : ["settings-reasons", "list"], queryFn: () => reasonsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveReason = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof reasonsApi.create>[0] }) => (id ? reasonsApi.update(id, data) : reasonsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-reasons"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteReason = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reasonsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-reasons"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useTables = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-tables", "list", sort] : ["settings-tables", "list"], queryFn: () => tablesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof tablesApi.create>[0] }) => (id ? tablesApi.update(id, data) : tablesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-tables"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tablesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-tables"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const usePricing = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-pricing", "list", sort] : ["settings-pricing", "list"], queryFn: () => pricingApi.list(sort), placeholderData: keepPreviousData })

export const useSavePricing = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof pricingApi.create>[0] }) => (id ? pricingApi.update(id, data) : pricingApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-pricing"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeletePricing = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pricingApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-pricing"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useDiscounts = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["settings-discounts", "list", sort] : ["settings-discounts", "list"], queryFn: () => discountsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveDiscount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof discountsApi.create>[0] }) => (id ? discountsApi.update(id, data) : discountsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-discounts"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteDiscount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => discountsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-discounts"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
