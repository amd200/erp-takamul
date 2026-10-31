import { ApiError } from "./ApiError"

/** One key per document (not per click): the server replays the first answer when it sees a key twice. */
export const newIdempotencyKey = () => crypto.randomUUID()

const IN_PROGRESS = "IDEMPOTENCY_IN_PROGRESS"
const RETRIES = 5
const DELAY_MS = 1500

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
