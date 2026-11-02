import { useQuery } from "@tanstack/react-query"

/** Printer names from QZ Tray, plus the current value so a saved printer stays visible. Empty list when QZ is not running. */
export function usePrinterOptions(current?: string | null) {
  const { data = [] } = useQuery({
    queryKey: ["qz-printers"],
    queryFn: async () => (await import("./qz")).listPrinters(),
    staleTime: 60_000,
    retry: false,
  })
  const names = current && !data.includes(current) ? [current, ...data] : data
  return names.map((p) => ({ value: p, label: p }))
}
