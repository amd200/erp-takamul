import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** The old system's status chip: a flat rounded-md tag, text-xs medium, with a soft tinted background. */
const TONES = {
  success: "text-[#09ad95] bg-[#00e6821a]",
  danger: "text-[#b40b09] bg-[#f50b0b1a]",
  warning: "text-[#f59e0b] bg-[#fef3c7]",
  refunded: "text-[#ef4444] bg-[#fee2e2]",
  neutral: "bg-slate-100 text-slate-700",
} as const

export type StatusTone = keyof typeof TONES

export function StatusBadge({ tone, className, ...props }: ComponentProps<"span"> & { tone: StatusTone }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", TONES[tone], className)} {...props} />
}
