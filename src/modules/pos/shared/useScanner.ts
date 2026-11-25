import { useEffect, useRef } from "react"

/**
 * A barcode scanner types like a very fast keyboard and ends with Enter. This catches such a code
 * when no field has focus; when one does, the field receives the keys as usual.
 */
export function useScanner(onScan: (code: string) => void) {
  const handler = useRef(onScan)
  useEffect(() => { handler.current = onScan }, [onScan])

  useEffect(() => {
    let buffer = ""
    let last = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const down = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el instanceof HTMLElement && el.isContentEditable)) return
      const now = Date.now()
      const fast = now - last < 50
      last = now
      if (e.key === "Enter") {
        if (buffer.length > 2) handler.current(buffer)
        buffer = ""
        return
      }
      if (e.key.length !== 1) return
      buffer = fast || buffer ? buffer + e.key : e.key
      clearTimeout(timer)
      timer = setTimeout(() => { buffer = "" }, 300)
    }

    window.addEventListener("keydown", down)
    return () => { window.removeEventListener("keydown", down); clearTimeout(timer) }
  }, [])
}
