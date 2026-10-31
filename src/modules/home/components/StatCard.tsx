import type { LucideIcon } from "lucide-react"
import { SaudiRiyal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

/** One of the four coloured "today" cards; the colours are the current system's `--dashboard-*` tokens. */
export function StatCard({ title, value, icon: Icon, className, delay, onClick }: { title: string; value: string; icon: LucideIcon; className: string; delay: number; onClick?: () => void }) {
  const { i18n } = useTranslation()
  return (
    <div onClick={onClick} style={{ animationDelay: `${delay}s` }}
      className={cn("relative cursor-pointer overflow-hidden rounded-xl p-4 shadow-lg transition-transform fill-mode-backwards animate-in fade-in slide-in-from-bottom-5 hover:scale-[1.02]", className)}>
      <div className="relative z-10">
        <p className="mb-1 truncate text-base font-bold opacity-80">{title}</p>
        <h3 className="flex items-center gap-2 overflow-hidden text-2xl font-bold text-ellipsis whitespace-nowrap md:text-3xl">
          {value}
          {i18n.language === "ar" ? <SaudiRiyal size={30} className="opacity-90" /> : <span className="ms-1 text-2xl font-bold opacity-90">SAR</span>}
        </h3>
      </div>
      <div className="absolute -bottom-6 opacity-10 ltr:-right-6 rtl:-left-6">
        <Icon size={120} />
      </div>
    </div>
  )
}
