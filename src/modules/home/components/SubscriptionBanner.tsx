import { ArrowUpRight, Calendar, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/shared/auth/authStore"
import { useRenewSubscription, useSubscriptionDays } from "../queries"

/** The welcome strip above the dashboard: greeting, today's date and the subscription renewal button with the days left. */
export function SubscriptionBanner() {
  const { t } = useTranslation()
  const userName = useAuthStore((s) => s.session?.userName)
  const { data } = useSubscriptionDays()
  const renew = useRenewSubscription()
  const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-")

  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-(--border) bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-5 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-(--bg-main) p-2 text-primary">
          <Calendar size={24} />
        </div>
        <div>
          <h2 className="font-bold text-primary">{t("home.welcome")} {userName}</h2>
          <p className="text-sm text-(--text-muted)">{t("home.totalOperationsDate")} ({today})</p>
        </div>
      </div>
      <button type="button" onClick={() => renew.mutate()} disabled={renew.isPending}
        className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--bg-main) px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
        {renew.isPending ? <Loader2 className="animate-spin" size={16} /> : <ArrowUpRight size={16} />}
        {t("home.renewSubscription", { days: data?.data?.remainingDays ?? 0 })}
      </button>
    </div>
  )
}
