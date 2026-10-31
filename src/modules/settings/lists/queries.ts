import { createCrudQueries } from "@/shared/api/crudQueries"
import { currenciesApi, deliveryApi, discountsApi, pricingApi, reasonsApi, tablesApi, taxesListApi } from "./service"

export const { useList: useDelivery, useSave: useSaveDelivery, useDelete: useDeleteDelivery } = createCrudQueries("settings-delivery", deliveryApi)
export const { keys: currencyKeys, useList: useCurrencies, useSave: useSaveCurrency, useDelete: useDeleteCurrency } = createCrudQueries("settings-currencies", currenciesApi)
export const { useList: useTaxList, useSave: useSaveTax, useDelete: useDeleteTax } = createCrudQueries("settings-taxes", taxesListApi)
export const { useList: useReasons, useSave: useSaveReason, useDelete: useDeleteReason } = createCrudQueries("settings-reasons", reasonsApi)
export const { useList: useTables, useSave: useSaveTable, useDelete: useDeleteTable } = createCrudQueries("settings-tables", tablesApi)
export const { useList: usePricing, useSave: useSavePricing, useDelete: useDeletePricing } = createCrudQueries("settings-pricing", pricingApi)
export const { useList: useDiscounts, useSave: useSaveDiscount, useDelete: useDeleteDiscount } = createCrudQueries("settings-discounts", discountsApi)
