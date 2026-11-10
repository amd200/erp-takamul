/** Small reference lists (taxes, shift pickers ...) share this root so one call can refresh them all. */
export const refKeys = {
  all: ["refs"] as const,
}
