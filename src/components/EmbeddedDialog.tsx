import type { ReactNode } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Shows a dialog's body inside another window (a tab of a bigger dialog) instead of as its own popup. The dialog's title
 * and description still need a dialog around them, so an always-open, non-modal one is given that renders nothing itself.
 */
export function EmbeddedDialog({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Root open modal={false}>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto", className)}>{children}</div>
    </DialogPrimitive.Root>
  )
}
