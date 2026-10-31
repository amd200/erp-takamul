import { Delete } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "00"]

/** Digits for the amount being typed. The layout is fixed left to right, whatever the page direction. */
export function Keypad({ onKey, disabled, className, keyClass }: { onKey: (k: string) => void; disabled?: boolean; className?: string; keyClass?: string }) {
  const { t } = useTranslation()
  return (
    <div dir="ltr" className={cn("grid grid-cols-3 gap-2", className)}>
      {KEYS.map((k) => <Button key={k} type="button" variant="outline" disabled={disabled} className={cn("h-14 text-xl font-semibold", keyClass)} onClick={() => onKey(k)}>{k}</Button>)}
      <Button type="button" variant="outline" disabled={disabled} aria-label={t("pos.backspace")} className={cn("col-span-3 h-12", keyClass)} onClick={() => onKey("back")}><Delete /></Button>
    </div>
  )
}
