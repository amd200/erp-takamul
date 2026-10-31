import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/** Bordered, rounded icon buttons that turn green (edit) or red (delete) on hover, as in the current system. */
const editBtn = "rounded-lg border text-[var(--text-muted)] hover:border-green-100 hover:bg-[#f0fdf4] hover:text-[#16a34a]"

/** Edit / delete icons at the end of a table row. Pass `editTo` for a page, `onEdit` for a dialog. */
export function RowActions({ editTo, onEdit, onDelete }: { editTo?: string; onEdit?: () => void; onDelete?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-center gap-2">
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
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={onDelete} className="rounded-lg border text-[var(--text-muted)] hover:border-red-100 hover:bg-[#fef2f2] hover:text-[#dc2626]"><Trash2 /></Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.delete")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
