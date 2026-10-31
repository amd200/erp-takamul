import { createCrudQueries } from "@/shared/api/crudQueries"
import { suppliersApi } from "./service"

export const {
  keys: supplierKeys,
  useList: useSupplierList,
  useDetail: useSupplier,
  useSave: useSaveSupplier,
  useDelete: useDeleteSupplier,
} = createCrudQueries("suppliers", suppliersApi)
