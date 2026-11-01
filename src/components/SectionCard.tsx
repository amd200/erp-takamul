import type { ReactNode } from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useClassic } from "@/shared/theme/ThemeProvider"

/**
 * A block inside a page, as in the current system's forms: a white box with a thin border and 24px of padding, its title
 * (18px bold) above the body. Without a title, description or action it is just the body, as around a list.
 */
export function SectionCard({ title, description, action, children, flat }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; /** Just the body, no box and no title: for parts of one big form card. */ flat?: boolean }) {
  const classic = useClassic()
  if (flat || (classic && !title && !description && !action)) return <div>{children}</div>
  if (!classic) {
    return (
      <Card className="ring-0!">
        {(title || description || action) && (
          <CardHeader>
            {title && <CardTitle className="text-[15px]">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
            {action && <CardAction>{action}</CardAction>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    )
  }
  return (
    <section className="rounded-sm border border-border bg-background p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
