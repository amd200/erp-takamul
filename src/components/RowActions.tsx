import { Link } from "react-router-dom"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useClassic } from "@/shared/theme/ThemeProvider"

/** Bordered, rounded icon buttons that turn green (edit) or red (delete) on hover, as in the current system. */
const classicEdit = "rounded-lg border text-[var(--text-muted)] hover:border-green-100 hover:bg-[#f0fdf4] hover:text-[#16a34a]"

/** Edit / view / delete icons at the end of a table row. Pass `editTo` for a page, `onEdit` for a dialog. */
export function RowActions({ editTo, onEdit, viewTo, onDelete }: { editTo?: string; onEdit?: () => void; viewTo?: string; onDelete?: () => void }) {
  const { t } = useTranslation()
  const classic = useClassic()
  const editBtn = classic ? classicEdit : ""
  return (
    <div className={cn("flex", classic ? "justify-center gap-2" : "justify-end gap-0.5")}>
      {(editTo || onEdit) && (
        <Tooltip>
          <TooltipTrigger asChild>
            {editTo ? (
              <Button asChild variant="ghost" size="icon" aria-label={t("common.edit")} className={editBtn}><Link to={editTo}><Pencil /></Link></Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={onEdit} className={editBtn}><Pencil /></Button>
            )}
          </TooltipTrigger>
          <TooltipContent>{t("common.edit")}</TooltipContent>
        </Tooltip>
      )}
      {viewTo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" aria-label={t("common.view")} className={editBtn}><Link to={viewTo}><Eye /></Link></Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.view")}</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost-destructive" size="icon" aria-label={t("common.delete")} onClick={onDelete} className={classic ? "rounded-lg border" : ""}><Trash2 /></Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.delete")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
