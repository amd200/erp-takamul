import { useSyncExternalStore } from "react"

const QUERY = "(max-width: 639px)"

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** True below Tailwind's `sm` breakpoint, where dialogs turn into bottom drawers. */
export const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
