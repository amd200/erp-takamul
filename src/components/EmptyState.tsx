import type { ReactNode } from "react"

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-6">{icon}</div>
      <div className="font-semibold">{title}</div>
      {hint && <div className="max-w-sm text-muted-foreground">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
