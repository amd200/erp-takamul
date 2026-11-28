import type { Settings } from "@/modules/settings/types"

type Record_ = { id: number; [field: string]: unknown }

/**
 * One business activity of the demo (restaurant, salon...): its own branch, catalog, cash boxes and settings.
 * Records use the server's own field names. The shared records (demo user, default customer, shift) live in seed/common.ts.
 */
export type Profile = {
  /** The first segment of the address: simulation.takamulb.online/<id>. */
  id: string
  /** Shown in the demo banner. */
  title: string
  branch: Record_
  categories: Record_[]
  /** Items as the server stores them; `imageUrl` may name a file in the profile's images folder (see `images`). */
  products: Record_[]
  treasuries: Record_[]
  suppliers: Record_[]
  expenseItems: Record_[]
  settings: Settings
  /** Bundled pictures by file name, from the profile's images folder. */
  images: Record<string, string>
}
