import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

/** The auth pages' rounded input with its icon at the end (old look). */
export const authFieldClass =
  "h-auto w-full ps-4 pe-12 py-4 text-base sm:text-sm rounded-xl outline-none transition-colors border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary bg-card dark:bg-input border-border text-foreground placeholder:text-muted-foreground"

export function AuthField({ icon: Icon, ...props }: ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Input className={authFieldClass} {...props} />
      <Icon size={20} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function AuthError({ children }: { children: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-start text-sm text-red-500">
      <div className="mt-1.5 size-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
      <p className="flex-1 leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  )
}

export const authButtonClass = "w-full rounded-lg bg-primary py-4 sm:py-3 text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
