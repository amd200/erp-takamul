import { Link, useParams } from "react-router-dom"
import { purchaseTotals } from "../form"
import { Pencil, Printer, ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useTreasuries, useWarehouses } from "@/modules/lookups/service"
import { PaymentBadge } from "@/modules/sales/components/StatusBadges"
import { TotalsPanel } from "@/modules/sales/components/TotalsPanel"
import { useAppSettings } from "@/modules/settings"
import { usePurchase } from "../queries"

export default function PurchaseViewPage() {
  const { t, i18n } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const { id } = useParams()
  const { data: p, isLoading, isError } = usePurchase(Number(id))
  const { data: warehouses = [] } = useWarehouses()
  const { data: treasuries = [] } = useTreasuries()

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted" />
  if (isError || !p) return <EmptyState icon={<ShoppingBag />} title={t("purchases.notFound")} action={<Button asChild variant="outline"><Link to="/purchases">{t("quotes.backToList")}</Link></Button>} />

  const info: [string, string][] = [
    [t("purchases.supplier"), p.supplierName || "—"],
    [t("common.date"), p.orderDate ? formatDateTime(p.orderDate, i18n.language) : "—"],
    [t("sales.warehouse"), warehouses.find((w) => w.id === p.warehouseId)?.warehouseName ?? "—"],
  ]

  return (
    <>
      <PageHeader title={p.purchaseOrderNumber ?? ""} actions={
        <>
          <Button variant="outline" size="lg" className="print:hidden" onClick={() => window.print()}><Printer />{t("sales.actions.print")}</Button>
          <Can perm={P.purchases.edit}><Button asChild size="lg" className="print:hidden"><Link to={`/purchases/${p.id}/edit`}><Pencil />{t("common.edit")}</Link></Button></Can>
        </>
      } />
      <div><PaymentBadge status={p.paymentStatus} /></div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title={t("sales.details")}>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              {info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            {p.notes && <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-muted-foreground">{p.notes}</p>}
          </SectionCard>
          <SectionCard title={t("sales.lines")}>
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[t("products.item"), t("products.quantity"), t("purchases.cost"), t("sales.discount"), ...(exempt ? [] : [t("sales.tax")]), t("sales.lineTotal")].map((h) => <TableHead key={h} className="text-muted-foreground">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(p.items ?? []).map((l, i) => {
                  const discount = (l.discountValue ?? 0) * l.quantity
                  const returned = l.returnedQuantity ?? 0
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-semibold">{l.productName}</div>
                        <div className="text-xs text-muted-foreground">{l.unitName}{returned > 0 && <StatusBadge tone="warning" className="ms-2">{t("purchases.returned", { count: returned })}</StatusBadge>}</div>
                      </TableCell>
                      <TableCell className="tabular-nums">{l.quantity}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(l.priceBeforeTax ?? l.unitPrice ?? 0)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{discount ? formatMoney(discount) : "—"}</TableCell>
                      {!exempt && <TableCell className="tabular-nums text-muted-foreground">{formatMoney(l.taxAmount ?? 0)}</TableCell>}
                      <TableCell className="font-semibold tabular-nums">{formatMoney(l.lineTotal ?? 0)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </SectionCard>
          {(p.payments ?? []).length > 0 && (
            <SectionCard title={t("sales.payments")}>
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">{[t("common.date"), t("sales.method"), t("sales.treasury"), t("sales.amount")].map((h) => <TableHead key={h} className="text-muted-foreground">{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {(p.payments ?? []).map((x, i) => (
                    <TableRow key={x.id ?? i}>
                      <TableCell>{x.paymentDate ? formatDateTime(x.paymentDate, i18n.language) : "—"}</TableCell>
                      <TableCell>{t(`sales.methods.${x.paymentMethod ?? x.paymentType}`)}</TableCell>
                      <TableCell className="text-muted-foreground">{treasuries.find((y) => y.id === x.treasuryId)?.name ?? "—"}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatMoney(x.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start"><SectionCard title={t("sales.summary")}><TotalsPanel totals={purchaseTotals(p)} paid={p.paidAmount ?? 0} /></SectionCard></aside>
      </div>
    </>
  )
}
