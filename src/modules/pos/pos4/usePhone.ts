import { useSyncExternalStore } from "react"

/** The width below which the menu is one scrolling page (the cart goes in a sheet). */
export const PHONE = "(max-width: 1023px)"

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

export const usePhone = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false)
