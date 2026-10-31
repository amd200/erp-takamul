import { createCrudQueries } from "@/shared/api/crudQueries"
import { unitsApi } from "./service"

export const { useList: useUnits, useSave: useSaveUnit, useDelete: useDeleteUnit } = createCrudQueries("units", unitsApi)
