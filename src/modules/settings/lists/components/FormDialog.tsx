import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"

/** The add/edit window every settings list uses: a title, the fields, cancel and save. */
export function FormDialog({ open, onOpenChange, title, onSubmit, pending, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; onSubmit: () => void; pending?: boolean; children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form id="list-form" onSubmit={(e) => { e.preventDefault(); onSubmit() }} noValidate>
          <FieldGroup className="gap-4">{children}</FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="list-form" disabled={pending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
