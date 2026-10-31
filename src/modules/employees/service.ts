import { fetchAllPages } from "@/shared/http/paged"
import { http } from "@/shared/http/request"
import type { Employee, EmployeeInput } from "./types"

export const employeesApi = {
  list: () => fetchAllPages<Employee>("/employees"),
  get: (id: number) => http<Employee>(`/employees/${id}`),
  create: ({ firstName, mobile, branchId }: EmployeeInput) =>
    http<{ message: string }>("/employees/CreateEmployee", { method: "POST", data: { firstName, lastName: "", mobile, ...(branchId ? { branchId } : {}) } }),
  update: (id: number, { firstName, mobile, branchId }: EmployeeInput) =>
    http<{ message: string }>(`/employees/${id}`, { method: "PUT", data: { firstName, lastName: "", mobile, ...(branchId ? { branchId } : {}) } }),
  remove: (id: number) => http<{ message: string }>(`/employees/${id}`, { method: "DELETE" }),
}
