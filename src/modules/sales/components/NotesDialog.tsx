import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateNotes } from "../queries"
import type { SalesOrderDto } from "../types"

export function NotesDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const save = useUpdateNotes()
  const [notes, setNotes] = useState("")
  useEffect(() => { if (invoice) setNotes(invoice.notes ?? "") }, [invoice])

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("sales.editNotesTitle", { number: invoice?.orderNumber })}</DialogTitle></DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="invoice-notes">{t("common.notes")}</FieldLabel>
            <Textarea id="invoice-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button disabled={save.isPending} onClick={() => invoice && save.mutate({ invoiceId: invoice.id, notes }, { onSuccess: () => onOpenChange(false) })}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
