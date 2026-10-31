/**
 * Loads `html` into a hidden frame of the given width, waits until fonts and images are ready,
 * runs `render` on it and removes the frame afterwards (`keepMs` later, so a print dialog can finish).
 */
export async function withFrame<T>(html: string, widthPx: number, render: (doc: Document, win: Window) => Promise<T> | T, keepMs = 0): Promise<T> {
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  // Off screen but laid out at full width: a 0×0 frame would wrap the text differently from the paper.
  Object.assign(frame.style, { position: "fixed", top: "0", left: "-10000px", width: `${widthPx}px`, height: "100px", border: "0" })
  document.body.appendChild(frame)
  try {
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve()
      frame.srcdoc = html
    })
    const win = frame.contentWindow
    const doc = frame.contentDocument
    if (!win || !doc) throw new Error("print frame unavailable")
    await doc.fonts.ready
    await Promise.all(Array.from(doc.images, (img) => img.complete ? undefined : new Promise((r) => { img.onload = img.onerror = r })))
    frame.style.height = `${doc.documentElement.scrollHeight}px`
    return await render(doc, win)
  } finally {
    setTimeout(() => frame.remove(), keepMs)
  }
}
