import { useQuery } from "@tanstack/react-query"
import { http } from "@/shared/http/request"
import type { Tax, ExemptionReason } from "./types"
import { taxKeys } from "./keys"

export const taxesApi = {
  list: () => http<Tax[]>("/Taxes"),
  reasons: async () => (await http<ExemptionReason[]>("/TaxExemptionReasons")).filter((d) => d.isActive !== false),
}

// Rarely changes, so keep it for the session. The full taxes screen comes with Settings.
export const useTaxes = (enabled = true) => useQuery({ queryKey: taxKeys.list, queryFn: taxesApi.list, enabled, staleTime: 30 * 60_000 })
export const useExemptionReasons = () => useQuery({ queryKey: taxKeys.reasons, queryFn: taxesApi.reasons, staleTime: 30 * 60_000 })
