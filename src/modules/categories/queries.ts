import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { CategoryQuery } from "./types"
import { createCrudQueries } from "@/shared/api/crudQueries"
import { categoriesApi } from "./service"

export const {
  keys: categoryKeys,
  useList: useCategories,
  useSave: useSaveCategory,
  useDelete: useDeleteCategory,
} = createCrudQueries("categories", categoriesApi)

export const useCategoryPage = (q: CategoryQuery) => useQuery({
  queryKey: [...categoryKeys.all, "page", q],
  queryFn: () => categoriesApi.page(q),
  placeholderData: keepPreviousData,
})
