/** The branch a customer's ordering screen belongs to, as /Branch/public-info sends it (no sign-in needed). */
export type PublicBranch = {
  id: number
  name: string
  shortName: string | null
  shortNameEn: string | null
  imageUrl: string | null
}

/** The items of one main category, in the order the categories are listed. */
export type ProductGroup<P> = { id: number; name: string; products: P[] }
