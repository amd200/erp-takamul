import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { AdditionQuery } from "./types"
import { createCrudQueries } from "@/shared/api/crudQueries"
import { additionsApi } from "./service"

export const { useList: useAdditions, useSave: useSaveAddition, useDelete: useDeleteAddition } = createCrudQueries("additions", additionsApi)

export const useAdditionPage = (q: AdditionQuery) => useQuery({
  queryKey: ["additions", "page", q],
  queryFn: () => additionsApi.page(q),
  placeholderData: keepPreviousData,
})
