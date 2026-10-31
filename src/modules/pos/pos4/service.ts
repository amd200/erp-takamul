import { http } from "@/shared/http/request"
import type { Category } from "@/modules/categories/types"
import type { Product } from "@/modules/products/types"
import type { PublicBranch } from "./types"

/** Everything the customer's own ordering screen reads. The server answers all of it without a sign-in. */
export const pos4Api = {
  branch: () => http<PublicBranch>("/Branch/public-info"),
  categories: () => http<Category[]>("/ProductCategories/MainCategory"),
  /** A branched item with the items it groups; the list of items does not carry them. */
  branched: (id: number) => http<Product>(`/Products/branched/${id}`),
}
