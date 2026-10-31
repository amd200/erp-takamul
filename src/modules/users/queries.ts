import { useQuery } from "@tanstack/react-query"
import { createCrudQueries } from "@/shared/api/crudQueries"
import { usersApi } from "./service"

export const { useList: useUsers, useSave: useSaveUser, useDelete: useDeleteUser } = createCrudQueries("users", usersApi)

export const useRoleNames = () => useQuery({ queryKey: ["users", "role-names"], queryFn: usersApi.roleNames, staleTime: 5 * 60_000 })
