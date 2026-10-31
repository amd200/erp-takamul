import type { ComponentType } from "react"

/** Route `lazy` loader for a page module; `name` picks a named export instead of the default. */
export const lazyPage =
  <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M = "default") =>
  () => load().then((m) => ({ Component: m[name] as ComponentType }))
