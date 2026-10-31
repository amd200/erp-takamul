import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useInvoiceStatistics } from "../queries"

/** E-invoices of the last 24 hours by their ZATCA state; shown only in tax stage two. */
export function OperationsStats() {
  const { t } = useTranslation()
  const { data } = useInvoiceStatistics()
  const stats = [
    { title: t("home.ops.valid"), value: data?.data?.totalinvoiceValid || 0, icon: CheckCircle2, line: "bg-emerald-500", iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { title: t("home.ops.notSent"), value: data?.data?.totalinvoiceNotSent || 0, icon: Clock, line: "bg-amber-500", iconBox: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { title: t("home.ops.rejected"), value: data?.data?.totalinvoiceRejected || 0, icon: XCircle, line: "bg-rose-500", iconBox: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
  ]

  return (
    <div className="mt-8 space-y-4">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-6 w-1.5 rounded-full bg-primary" />
        <h3 className="text-lg font-bold text-(--text-main)">{t("home.ops.title")}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:gap-6">
        {stats.map((s, i) => (
          <div key={s.title} style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 fill-mode-backwards animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-[#1e293b]">
            <div className={`absolute inset-x-0 top-0 h-[3px] opacity-80 ${s.line}`} />
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">{s.title}</p>
              <div className={`flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${s.iconBox}`}>
                <s.icon size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h4 className="text-[32px] leading-none font-extrabold text-[#0e1b35] dark:text-white">{s.value}</h4>
          </div>
        ))}
      </div>
    </div>
  )
}
