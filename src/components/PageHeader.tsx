import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { pageIcon } from "@/app/layout/pageIcons"

/**
 * The top of a page, as in the current system: the page's icon and title, the description under it, and the page's
 * buttons at the other end. The layout draws the bordered box around a page that has one (see `data-page-header`).
 */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  const Icon = pageIcon(useLocation().pathname)
  return (
    <div data-page-header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl leading-snug font-bold text-balance">{Icon && <Icon size={20} className="shrink-0 text-primary" />}{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
