import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

/** The phone's search box, filtering the page as you type. */
export function MobileSearch({ search, onSearch }: { search: string; onSearch: (q: string) => void }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="pos4-mobile-search flex items-center gap-2.5 bg-[var(--bg-main)] px-4 py-3 lg:hidden" dir={i18n.dir()}>
      <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-border/50 bg-card px-4 shadow-[0_6px_18px_color-mix(in_srgb,var(--foreground)_7%,transparent)] transition-all focus-within:border-primary/35 focus-within:shadow-[0_7px_22px_color-mix(in_srgb,var(--primary)_12%,transparent)] focus-within:ring-2 focus-within:ring-primary/10">
        <Search size={21} strokeWidth={1.9} className="shrink-0 text-foreground/85" aria-hidden="true" />
        <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t("pos4.productName")} aria-label={t("pos4.productName")}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden" />
        {search && (
          <button type="button" onClick={() => onSearch("")} aria-label={t("pos4.clearSearch")}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
