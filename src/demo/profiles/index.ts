import type { Profile } from "./types"

/** Every activity the demo offers, loaded only when its address is opened. The first one is the default. */
export const PROFILES: Record<string, () => Promise<Profile>> = {
  restaurant: () => import("./restaurant").then((m) => m.restaurant),
}

export const DEFAULT_PROFILE = "restaurant"
