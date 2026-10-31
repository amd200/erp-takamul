import { createCrudQueries } from "@/shared/api/crudQueries"
import { customersApi } from "./service"

export const {
  keys: customerKeys,
  useList: useCustomerList,
  useDetail: useCustomer,
  useSave: useSaveCustomer,
  useDelete: useDeleteCustomer,
} = createCrudQueries("customers", customersApi)
