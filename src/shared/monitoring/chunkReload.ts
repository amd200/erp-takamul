const KEY = "chunk-reload-at"
const WINDOW_MS = 30_000

/** A lazy page chunk that no longer exists on the server (a new build was deployed). */
export const isChunkError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically|ChunkLoadError/i.test(
    String((e as Error)?.message ?? e),
  )

let reloading = false

/**
 * Reloads the page silently to pick up the new build, at most once per 30 seconds.
 * Returns false when a reload already happened recently, so the caller shows the error screen instead of looping.
 */
export function reloadOnce(): boolean {
  if (reloading) return true
  try {
    const last = Number(sessionStorage.getItem(KEY))
    if (last && Date.now() - last < WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch { /* storage blocked: still reload once per page load */ }
  reloading = true
  window.location.reload()
  return true
}
