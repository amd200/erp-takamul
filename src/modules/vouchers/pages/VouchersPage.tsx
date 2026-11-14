import { useState } from "react"
import { voucherNumber } from "../types"
import { FileDown, HandCoins, Plus, Printer, Trash2, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowMenu } from "@/components/RowActions"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useTreasuryList } from "@/modules/treasuries/queries"
import type { Voucher, VoucherKind } from "../types"
import { VoucherDialog } from "../components/VoucherDialog"
import { SectionCard } from "@/components/SectionCard"
import { useDeleteVoucher, useVouchers } from "../queries"
import { useVoucherOutput } from "../print/useVoucherOutput"

/** One page for both voucher books; `kind` picks receipts or payments. */
function VouchersPage({ kind }: { kind: VoucherKind }) {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useVouchers({ SortBy: sortBy, SortDescending: sortDescending })
  const { data: treasuries = [] } = useTreasuryList()
  const del = useDeleteVoucher()
  const output = useVoucherOutput()
  const busy = (v: Voucher, as: "print" | "pdf") => output.isPending && output.variables?.voucher.id === v.id && output.variables.as === as
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Voucher | null>(null)
  const perm = kind === "receipt" ? P.vouchers.receipts : P.vouchers.payments
  const rows = (data ?? []).filter((v) => v.kind === kind).sort((a, b) => (sortBy ? 0 : b.transactionDate.localeCompare(a.transactionDate)))

  const columns: Column<Voucher>[] = [
    { id: "number", sortKey: "paymentNumber", header: t("vouchers.number"), cell: (v) => <span className="font-semibold">{v.paymentNumber || "—"}</span> },
    { id: "date", sortKey: "transactionDate", header: t("common.date"), cell: (v) => <span className="text-muted-foreground">{formatDateTime(v.transactionDate, i18n.language)}</span> },
    { id: "party", sortKey: kind === "receipt" ? "customerName" : "supplierName", header: t(kind === "receipt" ? "vouchers.from" : "vouchers.to"), cell: (v) => (
      <span>{v.partyName}</span>
    ) },
    { id: "treasury", sortKey: "treasuryName", header: t("sales.treasury"), cell: (v) => treasuries.find((x) => x.id === v.treasuryId)?.name },
    { id: "amount", sortKey: "amount", header: t("sales.amount"), cell: (v) => <span className={kind === "receipt" ? "font-semibold text-success" : "font-semibold"}>{formatMoney(v.amount)}</span> },
    { id: "desc", sortKey: "description", header: t("vouchers.description"), cell: (v) => <span className="text-muted-foreground">{v.description || "—"}</span> },
    { id: "actions", header: "", align: "end", cell: (v) => {
      const run = (as: "print" | "pdf") => output.mutate({ voucher: v, treasuryName: treasuries.find((x) => x.id === v.treasuryId)?.name ?? "", as })
      return <RowMenu items={[
        { key: "print", label: t("reports.print"), icon: <Printer />, disabled: output.isPending, loading: busy(v, "print"), onSelect: () => run("print") },
        { key: "pdf", label: t("shifts.downloadPdf"), icon: <FileDown />, disabled: output.isPending, loading: busy(v, "pdf"), onSelect: () => run("pdf") },
        can(perm) && { key: "delete", label: t("common.delete"), icon: <Trash2 />, destructive: true, onSelect: () => setToDelete(v) },
      ]} />
    } },
  ]

  return (
    <>
      <PageHeader title={t(`vouchers.title.${kind}`)}
        actions={<Can perm={perm}><Button size="lg" onClick={() => setOpen(true)}><Plus />{t(`vouchers.new.${kind}`)}</Button></Can>} />
      <SectionCard>
        <DataTable rows={rows} loading={isLoading} columns={columns} sort={sort} rowKey={(v) => voucherNumber(v)}
          searchText={(v) => `${v.paymentNumber ?? ""} ${v.partyName} ${v.description}`} searchPlaceholder={t("vouchers.search")}
          empty={<EmptyState icon={kind === "receipt" ? <HandCoins /> : <Wallet />} title={t(`vouchers.empty.${kind}`)} hint={t("vouchers.emptyHint")} />} />
      </SectionCard>
      <VoucherDialog kind={kind} open={open} onOpenChange={setOpen} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("vouchers.deleteTitle")} description={t("vouchers.deleteBody", { number: toDelete && voucherNumber(toDelete) })}
        onConfirm={() => toDelete && del.mutate(toDelete, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}

export const ReceiptsPage = () => <VouchersPage kind="receipt" />
export const PaymentsPage = () => <VouchersPage kind="payment" />
