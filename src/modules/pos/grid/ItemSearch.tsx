import { useId, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

export type SearchOption = { id: number; name: string; code: string; price: number }

/**
 * The search cell of the first table row. Typing a name lists matches; a code (digits only, what a
 * scanner types) is looked up on Enter, so scanning never opens the list.
 */
export function ItemSearch({ options, onPick, onCode, onQuery, searching, className, placeholder, bare, posStyle }: {
  options: SearchOption[]
  onPick: (id: number) => void
  /** Called with an exact code on Enter; returns whether an item was added. */
  onCode: (code: string) => boolean | Promise<boolean>
  /** When given, `options` already come filtered from the server for what is typed here. */
  onQuery?: (query: string) => void
  searching?: boolean
  className?: string
  placeholder?: string
  /** Borderless, for the search cell of a table row. */
  bare?: boolean
  /** The sales screen's list, as in the current POS: nothing is highlighted until the arrows are used, so Enter only adds
   * an exact code or name, or the only match; the price shows as the item has it, with the currency under it. */
  posStyle?: boolean
}) {
  const { t } = useTranslation()
  const listId = useId()
  const [q, setQ] = useState("")
  const start = posStyle ? -1 : 0
  const [active, setActive] = useState(start)
  const [missed, setMissed] = useState(false)

  const query = q.trim().toLowerCase()
  const open = !!query && !/^\d+$/.test(query)
  const matches = useMemo(() => {
    if (!open) return []
    return (onQuery ? options : options.filter((o) => o.name.toLowerCase().includes(query) || o.code.toLowerCase().includes(query))).slice(0, 50)
  }, [open, options, query, onQuery])

  const reset = () => { setQ(""); setActive(start); setMissed(false); onQuery?.("") }
  const pick = (id: number) => { onPick(id); reset() }
  const change = (value: string) => {
    setQ(value); setActive(start); setMissed(false)
    // Only names are searched on the server; a code waits for Enter.
    const text = value.trim()
    onQuery?.(text && !/^\d+$/.test(text) ? text : "")
  }

  const enter = async () => {
    if (!query) return
    if (open && matches[active]) return pick(matches[active].id)
    if (await onCode(q.trim())) return reset()
    const exact = posStyle ? matches.find((o) => o.name.toLowerCase() === query) : undefined
    if (exact) return pick(exact.id)
    if (matches.length === 1) return pick(matches[0].id)
    setMissed(true)
  }

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground", posStyle ? "start-1.5 size-[9px]" : bare ? "start-2 size-3" : "start-2.5 size-4")} />
          <input value={q} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-invalid={missed || undefined}
            aria-label={placeholder ?? t("pos.search")} placeholder={placeholder ?? t("pos.search")}
            onChange={(e) => change(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); enter() }
              else if (e.key === "Escape") reset()
              else if (e.key === "ArrowDown" && open) { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)) }
              else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
            }}
            className={posStyle
              ? "h-6 w-full border-0 bg-transparent ps-4.5 pe-1.5 text-[13px] text-foreground outline-hidden placeholder:text-muted-foreground"
              : bare
              ? "h-8 w-full border-0 bg-transparent ps-6 pe-2 text-[11px] text-foreground outline-hidden placeholder:text-muted-foreground"
              : "h-10 w-full rounded-lg border border-input bg-background ps-8 pe-2 text-sm outline-none transition-colors placeholder:text-faint focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive"} />
          {missed && <p className="absolute start-0 top-full z-20 mt-1 rounded-md bg-destructive-soft px-2 py-1 text-xs whitespace-nowrap text-destructive">{t("pos.codeNotFound")}</p>}
        </div>
      </PopoverAnchor>
      {/* In a portal, so a scrolling table around the search does not clip the list. */}
      <PopoverContent align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} className="w-[max(var(--radix-popover-trigger-width),20rem)] p-1">
        <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto">
          {matches.length === 0 ? <li className="px-3 py-4 text-center text-sm text-muted-foreground">{searching ? t("common.loading") : t("sales.noItemFound")}</li> : matches.map((o, i) => (
            <li key={o.id} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o.id) }} onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start", i === active && "bg-muted")}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{o.name}</span>
                {o.code && <span className="block text-[10px] text-muted-foreground" dir="ltr">{o.code}</span>}
              </span>
              {posStyle
                ? <span className="flex shrink-0 flex-col items-end gap-0.5"><span className="text-xs font-bold text-primary">{o.price}</span><span className="text-[12px] text-muted-foreground uppercase">{t("pos1.sar")}</span></span>
                : <span className="text-xs font-bold text-primary tabular-nums">{formatMoney(o.price)}</span>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
