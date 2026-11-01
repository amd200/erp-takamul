import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { pageIcon } from "@/app/layout/pageIcons"
import { useClassic } from "@/shared/theme/ThemeProvider"

/**
 * The top of a page, as in the current system: the page's icon and title, the description under it, and the page's
 * buttons at the other end. The layout draws the bordered box around a page that has one (see `data-page-header`).
 * `crumbs` is shown only in the modern look; the current system shows no breadcrumb.
 */
export function PageHeader({ crumbs, title, description, actions }: { crumbs?: string[]; title: string; description?: string; actions?: ReactNode }) {
  const Icon = pageIcon(useLocation().pathname)
  if (!useClassic()) {
    return (
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {crumbs && <div className="text-xs text-faint">{crumbs.join(" / ")}</div>}
          <h1 className="mt-0.5 text-[22px] font-bold text-balance">{title}</h1>
          {description && <p className="mt-0.5 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    )
  }
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
