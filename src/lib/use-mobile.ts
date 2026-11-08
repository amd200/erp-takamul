import { useSyncExternalStore } from "react"

const QUERY = "(max-width: 639px)"

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** True below Tailwind's `sm` breakpoint, where dialogs turn into bottom drawers. */
export const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)

/** True below Tailwind's `md` breakpoint, where the side menu becomes a sheet. */
const NAV_QUERY = "(max-width: 767px)"
const subscribeNav = (cb: () => void) => {
  const mq = window.matchMedia(NAV_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
export const useIsMobileNav = () => useSyncExternalStore(subscribeNav, () => window.matchMedia(NAV_QUERY).matches, () => false)
