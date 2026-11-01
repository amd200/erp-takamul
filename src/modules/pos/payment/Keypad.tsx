import { Delete } from "lucide-react"
import { useTranslation } from "react-i18next"

const ROWS = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], [".", "0", "back"]]

/** Digits for the amount being typed, as the old numpad: four rows of three. The layout is fixed left to right, whatever the page direction. */
export function Keypad({ onKey, disabled }: { onKey: (k: string) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  return (
    <div dir="ltr" className="flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-1.5">
          {row.map((k) => (
            <button key={k} type="button" disabled={disabled} aria-label={k === "back" ? t("pos.backspace") : k} onClick={() => onKey(k)}
              className="min-h-12 rounded-xl border bg-muted/50 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50 disabled:active:scale-100">
              {k === "back" ? <Delete className="mx-auto size-[15px] text-muted-foreground" /> : k}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
