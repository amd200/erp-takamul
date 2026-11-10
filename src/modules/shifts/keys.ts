import { refKeys } from "@/shared/api/keys"

export const shiftKeys = {
  all: ["shifts"] as const,
  list: ["shifts", "list"] as const,
  report: (id: number) => ["shifts", "report", id] as const,
  branches: [...refKeys.all, "shift-branches"] as const,
  employees: (branchId: number) => [...refKeys.all, "shift-employees", branchId] as const,
  devices: [...refKeys.all, "shift-devices"] as const,
}
