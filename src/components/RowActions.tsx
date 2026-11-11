import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Eye, FileDown, Loader2, MoreHorizontal, Pencil, Printer, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type RowItem = {
  key: string
  label: string
  icon: ReactNode
  /** A link target, or a click handler. */
  to?: string
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
  loading?: boolean
  /** Falsy items are left out (and not counted). */
}

const menuItem = "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground"

/**
 * The actions at the end of a table row: up to two show as icon buttons, more than two collapse into one "⋯" menu (icon + text each).
 * Pass falsy for an action the user may not take.
 */
export function RowMenu({ items }: { items: (RowItem | false | null | undefined)[] }) {
  const { t } = useTranslation()
  const list = items.filter(Boolean) as RowItem[]
  if (list.length === 0) return null

  if (list.length <= 2) {
    return (
      <div className="flex justify-center gap-0.5">
        {list.map((i) => (
          <Tooltip key={i.key}>
            <TooltipTrigger asChild>
              {i.to ? (
                <Button asChild variant="ghost" size="icon" aria-label={i.label}><Link to={i.to}>{i.icon}</Link></Button>
              ) : (
                <Button type="button" variant={i.destructive ? "ghost-destructive" : "ghost"} size="icon" aria-label={i.label} disabled={i.disabled} onClick={i.onSelect}>{i.loading ? <Loader2 className="animate-spin" /> : i.icon}</Button>
              )}
            </TooltipTrigger>
            <TooltipContent>{i.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    )
  }

  const normal = list.filter((i) => !i.destructive)
  const danger = list.filter((i) => i.destructive)
  const render = (i: RowItem) => i.to ? (
    <DropdownMenuItem key={i.key} asChild><Link to={i.to} className={menuItem}>{i.icon}{i.label}</Link></DropdownMenuItem>
  ) : (
    <DropdownMenuItem key={i.key} className={`${menuItem} ${i.destructive ? "text-destructive" : ""}`} disabled={i.disabled} onSelect={i.onSelect}>{i.loading ? <Loader2 size={14} className="animate-spin" /> : i.icon}{i.label}</DropdownMenuItem>
  )
  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label={t("common.actions")}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-1">
          {normal.map(render)}
          {normal.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
          {danger.map(render)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Edit / view / print / PDF / delete at the end of a table row. Pass `editTo` for a page, `onEdit` for a dialog; `extra` adds more actions first. */
export function RowActions({ editTo, onEdit, viewTo, onPrint, onPdf, onDelete, extra = [] }: { editTo?: string; onEdit?: () => void; viewTo?: string; onPrint?: () => void; onPdf?: () => void; onDelete?: () => void; extra?: (RowItem | false | null | undefined)[] }) {
  const { t } = useTranslation()
  return (
    <RowMenu items={[
      ...extra,
      (!!editTo || !!onEdit) && { key: "edit", label: t("common.edit"), icon: <Pencil />, to: editTo, onSelect: onEdit },
      !!viewTo && { key: "view", label: t("common.view"), icon: <Eye />, to: viewTo },
      !!onPrint && { key: "print", label: t("common.print"), icon: <Printer />, onSelect: onPrint },
      !!onPdf && { key: "pdf", label: t("shifts.downloadPdf"), icon: <FileDown />, onSelect: onPdf },
      !!onDelete && { key: "delete", label: t("common.delete"), icon: <Trash2 />, onSelect: onDelete, destructive: true },
    ]} />
  )
}
