import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Banknote, Loader2, SaudiRiyal, ShoppingBag, TrendingUp } from "lucide-react"
import { useClassic } from "@/shared/theme/ThemeProvider"
import { formatMoney } from "@/lib/format"
import { P } from "@/shared/permissions/permissions"
import { useCan } from "@/shared/permissions/usePermission"
import { useAppSettings } from "@/modules/settings"
import { useTodayExpenses, useTodayProfit, useTodayPurchases, useTodaySales } from "../queries"
import { StatCard } from "../components/StatCard"
import { OperationsStats } from "../components/OperationsStats"
import { RecentTransactions } from "../components/RecentTransactions"
import { Hero, Stat } from "../components/ModernHome"

/** The dashboard, as in the current system: today's four totals, the ZATCA counts in stage two, and the latest operations. */
export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const classic = useClassic()
  const can = useCan()
  const taxSetting = useAppSettings().taxSetting?.taxSetting

  const show = { sales: can(P.statistics.sales), expenses: can(P.statistics.expenses), profit: can(P.statistics.profit), purchases: can(P.statistics.purchases) }
  const sales = useTodaySales(show.sales)
  const purchases = useTodayPurchases(show.purchases)
  const expenses = useTodayExpenses(show.expenses)
  const profit = useTodayProfit(show.profit)

  if (sales.isLoading || purchases.isLoading || expenses.isLoading || profit.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="font-medium text-(--text-muted)">{t("home.loadingData")}</p>
        </div>
      </div>
    )
  }

  // As in the current system the whole page, latest operations included, needs one of the statistics permissions.
  if (!Object.values(show).some(Boolean)) return null

  if (!classic) {
    const money = (v: unknown) => formatMoney(Number(v ?? 0))
    return (
      <div className="flex flex-col gap-5">
        <Hero />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {show.sales && <Stat icon={SaudiRiyal} label={t("home.totalSales")} value={money(sales.data?.totalSales)} />}
          {show.purchases && <Stat icon={ShoppingBag} label={t("home.totalPurchases")} value={money(purchases.data?.totalPurchases)} />}
          {show.expenses && <Stat icon={Banknote} tone="warning" label={t("home.totalExpenses")} value={money(expenses.data?.totalExpenses)} />}
          {show.profit && <Stat icon={TrendingUp} label={t("home.netProfit")} value={money(profit.data?.netProfit)} to="/reports/profit" />}
        </div>
        {taxSetting === "SecondStage" && <OperationsStats />}
        <RecentTransactions />
      </div>
    )
  }

  return (
    <div className="relative space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {show.sales && <StatCard title={t("home.totalSales")} value={formatMoney(Number(sales.data?.totalSales ?? 0))} icon={SaudiRiyal} className="bg-(--dashboard-sales) text-(--dashboard-sales-text)" delay={0.1} />}
        {show.expenses && <StatCard title={t("home.totalExpenses")} value={formatMoney(Number(expenses.data?.totalExpenses ?? 0))} icon={Banknote} className="bg-(--dashboard-expenses) text-(--dashboard-expenses-text)" delay={0.2} />}
        {show.profit && <StatCard title={t("home.netProfit")} value={formatMoney(Number(profit.data?.netProfit ?? 0))} icon={TrendingUp} className="bg-(--dashboard-profit) text-(--dashboard-profit-text)" delay={0.3} onClick={() => navigate("/reports/profit")} />}
        {show.purchases && <StatCard title={t("home.totalPurchases")} value={formatMoney(Number(purchases.data?.totalPurchases ?? 0))} icon={ShoppingBag} className="bg-(--dashboard-purchases) text-(--dashboard-purchases-text)" delay={0.4} />}
      </div>

      {taxSetting === "SecondStage" && <OperationsStats />}

      <RecentTransactions />
    </div>
  )
}
