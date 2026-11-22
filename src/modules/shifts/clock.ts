/** The shift clock as the current system shows it: "03:05:00 م" (12-hour, Latin digits). */
export function shiftClock(v: string | null | undefined): string {
  if (!v || v === "---") return "---"
  const [h, m = "00", sec = "00"] = v.split(":")
  const hours = Number(h)
  return `${String(hours % 12 || 12).padStart(2, "0")}:${m}:${sec.slice(0, 2)} ${hours >= 12 ? "م" : "ص"}`
}
