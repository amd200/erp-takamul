import { Link } from "react-router-dom"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/** Edit / view / delete icons at the end of a table row. Pass `editTo` for a page, `onEdit` for a dialog. */
export function RowActions({ editTo, onEdit, viewTo, onDelete }: { editTo?: string; onEdit?: () => void; viewTo?: string; onDelete?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-0.5">
      {(editTo || onEdit) && (
        <Tooltip>
          <TooltipTrigger asChild>
            {editTo ? (
              <Button asChild variant="ghost" size="icon" aria-label={t("common.edit")}><Link to={editTo}><Pencil /></Link></Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={onEdit}><Pencil /></Button>
            )}
          </TooltipTrigger>
          <TooltipContent>{t("common.edit")}</TooltipContent>
        </Tooltip>
      )}
      {viewTo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" aria-label={t("common.view")}><Link to={viewTo}><Eye /></Link></Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.view")}</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost-destructive" size="icon" aria-label={t("common.delete")} onClick={onDelete}><Trash2 /></Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.delete")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
