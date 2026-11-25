import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClearButton } from "./ItemEditor"
import { Numpad } from "./Numpad"

const MAX_DIGITS = 6

/**
 * Asks for a whole number on a keypad (the pager number, the table number), laid out like the current POS's window.
 * The server takes a whole number, so the dot does nothing. Done with only zeros gives null: no number.
 */
export function NumberPromptDialog({ open, onOpenChange, title, initial, onConfirm }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  initial: string | null
  onConfirm: (value: string | null) => void
}) {
  const { t } = useTranslation()
  const [buffer, setBuffer] = useState("0")
  const [first, setFirst] = useState(true)

  // Opens on the number already chosen.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBuffer(initial || "0"); setFirst(true)
  }, [open, initial])

  const press = (k: string) => {
    if (k === "del") return setBuffer((b) => (b.length > 1 ? b.slice(0, -1) : "0"))
    if (!/^\d$/.test(k)) return
    setBuffer((b) => (first || b === "0" ? k : b.length >= MAX_DIGITS ? b : b + k))
    setFirst(false)
  }

  const done = () => {
    const value = buffer.replace(/^0+/, "")
    onConfirm(value === "" ? null : value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm gap-0 overflow-hidden border-border bg-background p-0 text-foreground">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-right text-sm font-semibold text-foreground/80">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border bg-muted/50 px-4 py-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{title}</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{buffer}</span>
              <ClearButton onClick={() => { setBuffer("0"); setFirst(true) }} />
            </div>
          </div>
        </div>
        <div className="bg-background px-3 pt-3 pb-2"><Numpad onKey={press} /></div>
        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-4">
          <Button type="button" variant="outline" className="h-12 flex-1 gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={done}>{t("pos1.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
