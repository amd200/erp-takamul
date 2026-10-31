/**
 * Every failed request ends up as this one shape, whatever the server sent.
 * `status` is 0 when no response arrived (offline or timeout): the request may still have reached the server.
 */
export class ApiError extends Error {
  status: number
  /** Detail messages from the body; always an array, often empty. */
  errors: string[]
  /** Machine-readable reason some endpoints send, e.g. "DEVICE_CONFLICT" on login; "NETWORK" / "TIMEOUT" when status is 0. */
  code?: string

  constructor(message: string, status: number, { errors = [], code, cause }: { errors?: string[]; code?: string; cause?: unknown } = {}) {
    super(message, { cause })
    this.name = "ApiError"
    this.status = status
    this.errors = errors
    this.code = code
  }

  get isNetwork() { return this.status === 0 }
  get isUnauthorized() { return this.status === 401 }
}
