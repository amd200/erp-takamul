import { createCrudQueries } from "@/shared/api/crudQueries"
import { employeesApi } from "./service"

export const { useList: useEmployeeList, useSave: useSaveEmployee, useDelete: useDeleteEmployee } = createCrudQueries("employees", employeesApi)
