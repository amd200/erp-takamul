import type { ReactNode } from "react"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/** Soft header of the device dialogs: icon tile, title, description and an optional badge (the device's status). */
export function DeviceHero({ icon: Icon, title, description, badge }: { icon: React.ElementType; title: string; description?: string; badge?: ReactNode }) {
  return (
    <DialogHeader className="flex-row items-start gap-3 rounded-xl border bg-gradient-to-br from-secondary to-secondary/20 p-4 pe-12">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border [&_svg]:size-6"><Icon /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-lg font-semibold leading-snug">{title}</DialogTitle>
          {badge}
        </div>
        {description && <DialogDescription>{description}</DialogDescription>}
      </div>
    </DialogHeader>
  )
}

/** A rounded section with an optional small title, as the dialogs' form blocks. */
export function DeviceSection({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs">
      {title && <h3 className="mb-3 text-sm font-semibold">{title}</h3>}
      {children}
    </section>
  )
}
