import { http } from "@/shared/http/request"
import type { DiningTable } from "./types"

export const tablesApi = {
  list: () => http<DiningTable[]>("/dining-tables"),
  free: () => http<DiningTable[]>("/dining-tables/free"),
}
