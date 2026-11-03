import { startTransition, useLayoutEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Category } from "@/modules/categories/types"
import { PHONE } from "./usePhone"


/**
 * The category strip and the page it scrolls. On a wide screen picking a category swaps the grid; on a phone it
 * scrolls to that category's section, and scrolling the page moves the highlighted category the other way round.
 */
export function useMenuNavigation({ currentCat, setCurrentCat, main }: {
  currentCat: number | null
  setCurrentCat: Dispatch<SetStateAction<number | null>>
  main: Category[] | undefined
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const sections = useRef(new Map<number, HTMLElement>())

  const scroll = (dir: "right" | "left") => stripRef.current?.scrollBy({ left: dir === "left" ? 150 : -150, behavior: "smooth" })

  useLayoutEffect(() => {
    if (!window.matchMedia(PHONE).matches) return
    const container = menuRef.current
    if (!container) return

    const update = () => {
      // Sections come and go as they load, so they are read (and put in page order) on every scroll.
      const entries = Array.from(sections.current.entries()).sort((a, b) => a[1].offsetTop - b[1].offsetTop)
      const line = container.scrollTop + (container.querySelector<HTMLElement>(".pos4-menu-header")?.offsetHeight ?? 108) + 4
      let active: number | undefined = entries[0]?.[0]
      for (const [id, section] of entries) {
        if (section.offsetTop <= line) active = id
        else break
      }
      if (active !== undefined) {
        const first = main?.[0]?.id
        startTransition(() => setCurrentCat((cur) => (cur === active || (cur === null && active === first) ? cur : active)))
      }
    }

    let frame: number | null = null
    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => { frame = null; update() })
    }
    container.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      container.removeEventListener("scroll", onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [main, setCurrentCat])

  const selectCategory = (id: number) => {
    setCurrentCat(id)
    if (window.matchMedia(PHONE).matches) document.getElementById(`pos4-category-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const registerSection = (id: number, el: HTMLElement | null) => {
    if (el) sections.current.set(id, el)
    else sections.current.delete(id)
  }

  return { menuRef, stripRef, scroll, selectCategory, registerSection, currentCat }
}
