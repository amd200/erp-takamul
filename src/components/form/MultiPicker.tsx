import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

export type PickerOption = { value: number; label: string }

/**
 * Pick several items from a list that can be long: a search box, a fixed-height scrolling list of checkboxes,
 * and a count with "all" / "none". Stays the same size whether there are 5 options or 500.
 */
export function MultiPicker({ options, value, onChange }: { options: PickerOption[]; value: number[]; onChange: (value: number[]) => void }) {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const shown = useMemo(() => options.filter((o) => !q.trim() || o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q])
  const chosen = new Set(value)
  const toggle = (v: number) => onChange(chosen.has(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} className="h-9 ps-8" />
      </div>
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{t("common.selectedCount", { count: value.length, total: options.length })}</span>
        <span className="flex gap-3">
          <button type="button" className="text-primary hover:underline" onClick={() => onChange(options.map((o) => o.value))}>{t("common.selectAll")}</button>
          <button type="button" className="text-primary hover:underline" onClick={() => onChange([])}>{t("common.selectNone")}</button>
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {shown.length === 0 && <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t("common.noResults")}</p>}
        {shown.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
            <Checkbox checked={chosen.has(o.value)} onCheckedChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}
