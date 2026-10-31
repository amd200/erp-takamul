import { useQuery } from "@tanstack/react-query"
import { http } from "@/shared/http/request"
import type { Tax, ExemptionReason } from "./types"

export const taxesApi = {
  list: () => http<Tax[]>("/Taxes"),
  reasons: async () => (await http<ExemptionReason[]>("/TaxExemptionReasons")).filter((d) => d.isActive !== false),
}

// Rarely changes, so keep it for the session. The full taxes screen comes with Settings.
export const useTaxes = () => useQuery({ queryKey: ["refs", "taxes"], queryFn: taxesApi.list, staleTime: 30 * 60_000 })
export const useExemptionReasons = () => useQuery({ queryKey: ["refs", "tax-exemption-reasons"], queryFn: taxesApi.reasons, staleTime: 30 * 60_000 })
