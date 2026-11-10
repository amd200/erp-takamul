import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { currenciesApi, deliveryApi, discountsApi, pricingApi, reasonsApi, tablesApi, taxesListApi } from "./service"
import { deliverySettingsKeys, currencyKeys, taxSettingsKeys, reasonKeys, tableSettingsKeys, pricingKeys, discountKeys } from "./keys"

export const useDelivery = (sort?: ListSort) => useQuery({ queryKey: deliverySettingsKeys.list(sort), queryFn: () => deliveryApi.list(sort), placeholderData: keepPreviousData })

export const useSaveDelivery = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof deliveryApi.create>[0] }) => (id ? deliveryApi.update(id, data) : deliveryApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliverySettingsKeys.all })
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
      qc.invalidateQueries({ queryKey: deliverySettingsKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useCurrencies = (sort?: ListSort) => useQuery({ queryKey: currencyKeys.list(sort), queryFn: () => currenciesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveCurrency = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof currenciesApi.create>[0] }) => (id ? currenciesApi.update(id, data) : currenciesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: currencyKeys.all })
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
      qc.invalidateQueries({ queryKey: currencyKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useTaxList = (sort?: ListSort) => useQuery({ queryKey: taxSettingsKeys.list(sort), queryFn: () => taxesListApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTax = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof taxesListApi.create>[0] }) => (id ? taxesListApi.update(id, data) : taxesListApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxSettingsKeys.all })
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
      qc.invalidateQueries({ queryKey: taxSettingsKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useReasons = (sort?: ListSort) => useQuery({ queryKey: reasonKeys.list(sort), queryFn: () => reasonsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveReason = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof reasonsApi.create>[0] }) => (id ? reasonsApi.update(id, data) : reasonsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reasonKeys.all })
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
      qc.invalidateQueries({ queryKey: reasonKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useTables = (sort?: ListSort) => useQuery({ queryKey: tableSettingsKeys.list(sort), queryFn: () => tablesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof tablesApi.create>[0] }) => (id ? tablesApi.update(id, data) : tablesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tableSettingsKeys.all })
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
      qc.invalidateQueries({ queryKey: tableSettingsKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const usePricing = (sort?: ListSort) => useQuery({ queryKey: pricingKeys.list(sort), queryFn: () => pricingApi.list(sort), placeholderData: keepPreviousData })

export const useSavePricing = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof pricingApi.create>[0] }) => (id ? pricingApi.update(id, data) : pricingApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pricingKeys.all })
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
      qc.invalidateQueries({ queryKey: pricingKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useDiscounts = (sort?: ListSort) => useQuery({ queryKey: discountKeys.list(sort), queryFn: () => discountsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveDiscount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof discountsApi.create>[0] }) => (id ? discountsApi.update(id, data) : discountsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discountKeys.all })
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
      qc.invalidateQueries({ queryKey: discountKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
