import { fetchAllPages } from "@/shared/http/paged"
import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import type { Role } from "./types"

export const rolesApi = {
  list: (sort?: ListSort) => fetchAllPages<Role>("/permissions/AllRoles", { pageParam: "PageNumber", params: { ...sort } }),
  get: (roleId: string) => http<Role>(`/role-permissions/${roleId}`),
  // Creating also sets the permissions, and saving a role again with the same name would update it.
  create: (roleName: string, permissions: string[]) => http<unknown>("/permissions/upsert", { method: "POST", data: { roleName, permissions } }),
  update: (roleId: string, permissions: string[]) => http<unknown>("/role-permissions/update", { method: "POST", data: { roleId, permissions } }),
  remove: (roleName: string) => http<unknown>(`/permissions/RemoveRole/${encodeURIComponent(roleName)}`, { method: "DELETE" }),
}
