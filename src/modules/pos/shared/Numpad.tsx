import { Delete } from "lucide-react"
import { useTranslation } from "react-i18next"

const ROWS = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], [".", "0", "del"]]

/** The keypad of the current POS's item window: 7 8 9 on top, the dot, zero and delete at the bottom. */
export function Numpad({ onKey, disabled }: { onKey: (k: string) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-1.5">
          {row.map((k) => (
            <button key={k} type="button" disabled={disabled} aria-label={k === "del" ? t("pos.backspace") : k} onClick={() => onKey(k)}
              className="min-h-12 rounded-xl border border-border bg-muted/50 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50 disabled:active:scale-100">
              {k === "del" ? <Delete size={15} className="mx-auto text-muted-foreground" /> : k}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
