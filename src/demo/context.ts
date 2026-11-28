import type { Profile } from "./profiles/types"

let current: Profile | null = null

export const setProfile = (p: Profile) => { current = p }

/** The activity this tab runs (restaurant, salon...). */
export function profile(): Profile {
  if (!current) throw new Error("demo profile is not loaded")
  return current
}

/** A stored image: a file name from the profile's images folder becomes its bundled URL; uploads (data URLs) stay as they are. */
export const imageUrl = (v: unknown): string | null => (typeof v === "string" && v ? profile().images[v] ?? v : null)
