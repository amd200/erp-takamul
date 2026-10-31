import { useMemo, useState, type ReactNode } from "react"
import { ChevronLeft, FileText, Folder } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { PERMISSION_CATALOG, type PermissionAction } from "../catalog"
import { checkState, heldSet, shownActions, valuesOf, withValues, type CheckState, type TreeNode } from "../tree"

type Props = { value: string[]; onChange: (v: string[]) => void; readOnly?: boolean }

const box = (s: CheckState) => (s === "all" ? true : s === "some" ? ("indeterminate" as const) : false)

/**
 * The role's permissions as the current system shows them: one bordered list of sections, each opening onto its
 * pages, each page onto its actions, and some actions onto item types (direct, raw, prepared...). A folder's
 * checkbox selects everything under it and shows a partial state when only some of it is selected.
 */
export function PermissionTree({ value, onChange, readOnly }: Props) {
  const { t } = useTranslation()
  const label = (key: string) => t(`rolePerms.${key}`)
  const held = useMemo(() => heldSet(value), [value])
  const [open, setOpen] = useState<Set<string>>(new Set())
  const flip = (key: string) => setOpen((p) => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n })

  /** One row: its checkbox, icon and name; a row with children also opens and closes. */
  const row = (key: string, node: TreeNode, name: string, depth: 0 | 1 | 2 | 3, children?: ReactNode) => {
    const values = valuesOf(node)
    const state = checkState(values, held)
    const folder = children !== undefined
    const isOpen = open.has(key)
    const Icon = folder ? Folder : FileText
    return (
      <div key={key} className={depth === 0 ? "border-b border-border last:border-b-0" : undefined}>
        <div onClick={folder ? () => flip(key) : undefined}
          className={cn("flex items-center gap-2 py-2 pe-3 select-none", folder && "cursor-pointer",
            depth === 0 ? "px-3 py-2.5" : depth === 1 ? "ps-7" : depth === 2 ? "ps-12" : "ps-[4.25rem]",
            depth === 0 ? (state === "some" ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/40 hover:bg-muted/70") : state === "some" && folder ? "bg-primary/5 hover:bg-primary/10" : folder ? "bg-background hover:bg-muted/40" : "bg-muted/10")}>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={box(state)} disabled={readOnly} aria-label={name} onCheckedChange={() => onChange(withValues(value, values, state !== "all"))} />
          </div>
          <Icon className={cn("shrink-0", depth === 0 ? "size-4" : "size-3.5", folder ? (state !== "none" ? "text-primary" : depth === 0 ? "text-amber-500" : "text-amber-400") : "text-muted-foreground")} />
          <span className={cn("flex-1 text-sm", folder ? (state !== "none" ? "font-medium text-primary" : "text-foreground") : "text-muted-foreground")}>{name}</span>
          {folder && state === "some" && depth === 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{t("oldRoles.partial")}</span>}
          {folder && <ChevronLeft className={cn("text-muted-foreground transition-transform", depth === 0 ? "size-3.5" : "size-3", isOpen && "-rotate-90")} />}
        </div>
        {folder && isOpen && <div>{children}</div>}
      </div>
    )
  }

  const action = (parent: string, a: PermissionAction, depth: 1 | 2) => {
    const key = `${parent}/${a.id}`
    return "subs" in a
      ? row(key, a, label(a.label), depth, a.subs.map((s) => row(`${key}/${s.id}`, s, label(s.label), (depth + 1) as 2 | 3)))
      : row(key, a, label(a.label), depth)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {PERMISSION_CATALOG.map((section) =>
        row(section.id, section, label(section.label), 0, [
          ...section.pages.map((page) => row(`${section.id}/${page.id}`, page, label(page.label), 1, shownActions(page, label).map((a) => action(`${section.id}/${page.id}`, a, 2)))),
          ...(section.actions ?? []).map((a) => action(section.id, a, 1)),
        ]))}
    </div>
  )
}
