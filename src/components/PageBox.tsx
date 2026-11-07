import type { FormEventHandler, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * The box of a page whose title sits inside it (add / edit forms, lists, read-only views): the title, subtitle and back button sit inside the bordered box.
 * With `onSubmit` the box is itself the `<form>`.
 */
export function PageBox({ title, subtitle, action, icon: Icon, onSubmit, children }: {
  title: string; icon?: LucideIcon; subtitle?: string; action?: ReactNode; onSubmit?: FormEventHandler<HTMLFormElement>; children: ReactNode
}) {
  const header = (
    <div className={`mb-6 flex flex-wrap justify-between gap-3 print:hidden ${subtitle ? "items-start" : "items-center"}`}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl leading-snug font-bold">{Icon && <Icon size={20} className="text-primary" />}{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
  return onSubmit
    ? <form onSubmit={onSubmit} noValidate className="page-box">{header}{children}</form>
    : <div className="page-box">{header}{children}</div>
}
