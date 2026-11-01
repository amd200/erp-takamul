import type { ListSort } from "@/shared/api/crudQueries"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import type { User, UserInput } from "./types"

type RoleDto = { roleId: string; roleName: string }

const list = (sort?: ListSort) => fetchAllPages<User>("/employees/GetAllUsers", { params: { ...sort } })

export const usersApi = {
  list,
  // There is no single-user endpoint, so a user is read from the list.
  get: async (id: number) => {
    const user = (await list()).find((u) => u.id === id)
    if (!user) throw new Error(`User ${id} not found`)
    return user
  },
  // The branch goes as X-Branch-Id (it wins over the signed-in branch), not in the body. The name is kept on the employee.
  create: ({ name, mobile, branchId, userName, email, password, isMultiBranch, roleName }: UserInput) =>
    http<{ message: string }>("/employees/createuser", {
      method: "POST",
      headers: { "X-Branch-Id": String(branchId) },
      data: { employee: { firstName: name, lastName: "", mobile }, user: { userName, email, password, isMultiBranch }, roleName },
    }),
  // The name cannot be changed here; an empty password keeps the current one.
  update: (id: number, { userName, email, password, roleName, mobile, branchId, isMultiBranch }: UserInput) =>
    http<{ message: string }>(`/employees/${id}/user`, {
      method: "PUT",
      data: { userName, email, newPassword: password || undefined, roleName, mobile, branchId, isMultiBranch },
    }),
  // Deletes the employee together with their sign-in.
  remove: (id: number) => http<{ message: string }>(`/employees/${id}/with-user`, { method: "DELETE" }),
  /** The role names a user can be given. */
  roleNames: async () => (await fetchAllPages<RoleDto>("/permissions/AllRoles", { pageParam: "PageNumber" })).map((r) => r.roleName),
}
