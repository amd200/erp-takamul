import { ApiError } from "./ApiError"

/** One key per document (not per click): the server replays the first answer when it sees a key twice. */
export const newIdempotencyKey = () => crypto.randomUUID()

const IN_PROGRESS = "IDEMPOTENCY_IN_PROGRESS"
const RETRIES = 5
const DELAY_MS = 1500

/** A key the server says already saved different data cannot be used again: the next send takes a fresh one. */
export const renewIfReused = (key: { current: string }) => (e: unknown) => {
  if (e instanceof ApiError && e.code === "IDEMPOTENCY_KEY_REUSED") key.current = newIdempotencyKey()
}

const pins = new Map<string, string>()
/** A value taken when sending (like the time of day) must be the same on a resend of the same key, or the server sees different data. */
export const pinnedTo = (key: string | null | undefined, make: () => string) => {
  if (!key) return make()
  if (!pins.has(key)) pins.set(key, make())
  return pins.get(key)!
}

export const idempotencyHeaders = (key?: string | null): Record<string, string> | undefined => (key ? { "Idempotency-Key": key } : undefined)

/**
 * A 409 IDEMPOTENCY_IN_PROGRESS means an earlier send of the same key is still running, so the outcome
 * isn't known yet: wait and send again with the same key until it settles.
 */
export async function retryWhileInProgress<T>(send: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await send()
    } catch (e) {
      const waiting = e instanceof ApiError && e.status === 409 && e.code === IN_PROGRESS
      if (!waiting || attempt >= RETRIES) throw e
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }
}
