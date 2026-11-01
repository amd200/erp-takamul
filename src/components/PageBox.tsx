import type { FormEventHandler, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { useClassic } from "@/shared/theme/ThemeProvider"

/**
 * The box of a page whose title sits inside it (add / edit forms, lists, read-only views). Classic (the current system): the title, subtitle and back button sit inside the bordered box.
 * Modern (erpv2): the page header (with breadcrumb) sits above, and the form is a card below it.
 * With `onSubmit` the box is itself the `<form>`.
 */
export function PageBox({ title, subtitle, action, crumbs, icon: Icon, onSubmit, children }: {
  title: string; /** Shown beside the title in the classic look only. */ icon?: LucideIcon; subtitle?: string; action?: ReactNode; crumbs?: string[]; onSubmit?: FormEventHandler<HTMLFormElement>; children: ReactNode
}) {
  const classic = useClassic()
  if (classic) {
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
  const header = <div className="print:hidden"><PageHeader crumbs={crumbs} title={title} description={subtitle} actions={action} /></div>
  return onSubmit
    ? <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">{header}<div className="page-box">{children}</div></form>
    : <div className="flex flex-col gap-5">{header}<div className="page-box">{children}</div></div>
}
