import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Hash, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { expenseItemsApi } from "@/modules/expenses/service"
import { useTreasuries } from "@/modules/lookups/service"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { expensesReport, type ExpenseRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"
import { ALL, SelectFilter } from "../SelectFilter"
import { expenseItemKeys } from "@/modules/expenses/keys"

/** Expenses between two dates, by item and treasury, laid out as in the current system. */
export default function ExpensesDetailReport() {
  const { t } = useTranslation()
  const { data: items = [] } = useQuery({ queryKey: expenseItemKeys.refs, queryFn: () => expenseItemsApi.list() })
  const { data: treasuries = [] } = useTreasuries()
  const [item, setItem] = useState(ALL)
  const [treasury, setTreasury] = useState(ALL)
  const [applied, setApplied] = useState({ item: ALL, treasury: ALL })
  const nameOf = (list: { id: number; name?: string | null }[], id: string) => (id === ALL ? t("oldReports.all") : list.find((x) => String(x.id) === id)?.name ?? "")

  const extra = (
    <>
      <SelectFilter label={t("oldReports.item")} value={item} onChange={setItem} options={items.map((i) => ({ value: String(i.id), label: i.name ?? "" }))} placeholder={t("oldReports.select_item")} all />
      <SelectFilter label={t("oldReports.treasury")} value={treasury} onChange={setTreasury} options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} placeholder={t("oldReports.select_treasury")} all />
    </>
  )
  return (
    <PagedReport<ExpenseRow, Awaited<ReturnType<typeof expensesReport>>>
      id="expenses-detail" title={t("oldReports.expenses_report")} icon={Wallet} extra={extra} dep={applied}
      onSearch={() => setApplied({ item, treasury })} onClear={() => { setItem(ALL); setTreasury(ALL); setApplied({ item: ALL, treasury: ALL }) }}
      filterText={(a) => `${t("oldReports.item")}: ${nameOf(items, applied.item)} | ${t("oldReports.treasury")}: ${nameOf(treasuries, applied.treasury)} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => expensesReport({
        branchid: currentBranchId(), fromDate: a.from, toDate: a.to, Page: page, PageSize: size,
        expenseTypeId: applied.item === ALL ? undefined : applied.item, treasuryId: applied.treasury === ALL ? undefined : applied.treasury,
      })}
      rowsOf={(r) => r.data} totalOf={(r) => r.totalCount} rowKey={(r) => r.id}
      cards={(r) => [
        { title: t("oldReports.total_expenses"), value: money(r?.totalAmount), icon: Wallet, color: "orange" },
        { title: t("oldReports.operation_count"), value: String(r?.totalCount ?? 0), icon: Hash, color: "blue" },
      ]}
      columns={[
        { id: "date", header: t("oldReports.operation_date"), cell: (r) => <span className="text-sm">{dayText(r.expenseDate)}</span> },
        { id: "treasury", header: t("oldReports.treasury"), cell: (r) => r.treasuryName },
        { id: "amount", header: t("oldReports.amount"), cell: (r) => <span className="text-sm font-bold text-red-500">{money(r.amount)}</span> },
        { id: "item", header: t("oldReports.item"), cell: (r) => <span className="font-medium text-primary">{r.expenseTypeName || "-"}</span> },
        { id: "notes", header: t("oldReports.statement"), cell: (r) => r.notes },
      ]}
      outColumns={[
        { header: t("oldReports.operation_date"), value: (r) => dayText(r.expenseDate) },
        { header: t("oldReports.treasury"), value: (r) => r.treasuryName },
        { header: t("oldReports.amount"), value: (r) => money(r.amount) },
        { header: t("oldReports.item"), value: (r) => r.expenseTypeName || "-" },
        { header: t("oldReports.statement"), value: (r) => r.notes },
      ]} />
  )
}
