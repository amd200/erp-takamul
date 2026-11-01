import { useState } from "react"
import { ShieldCheck, ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { ExpiryBadge } from "../components/DeviceBadges"
import { useCertificates, useRevokeCertificate } from "../queries"
import type { CertificateSummary } from "../types"

/** E-invoicing certificates, one row per certificate, as /certificates/all-certificates/summary sends them. */
export default function CertificatesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useCertificates({ SortBy: sortBy, SortDescending: sortDescending })
  const revoke = useRevokeCertificate()
  const [toRevoke, setToRevoke] = useState<CertificateSummary | null>(null)

  const columns: Column<CertificateSummary>[] = [
    { id: "device", sortKey: "deviceName", header: t("devices.name"), cell: (c) => <span className="font-semibold">{c.deviceName}</span> },
    { id: "type", sortKey: "currentCertificateType", header: t("devices.certType"), cell: (c) => (c.currentCertificateType ? <StatusBadge tone={c.currentCertificateType === "PCSID" ? "success" : "warning"}>{t(`devices.certTypes.${c.currentCertificateType}`, { defaultValue: c.currentCertificateType })}</StatusBadge> : <span className="text-faint">—</span>) },
    { id: "status", sortKey: "hasActiveCertificate", header: t("devices.registration"), cell: (c) => (c.isExpired ? <StatusBadge tone="danger">{t("devices.expired")}</StatusBadge> : c.hasActiveCertificate ? <StatusBadge tone="success">{t("common.active")}</StatusBadge> : <StatusBadge tone="danger">{t("common.inactive")}</StatusBadge>) },
    { id: "expiry", sortKey: "expiresAt", header: t("devices.certExpiry"), cell: (c) => <ExpiryBadge expiresAt={c.expiresAt} daysLeft={c.daysUntilExpiry} expired={c.isExpired} /> },
    { id: "actions", header: "", align: "end", cell: (c) => can(P.certificates.delete) && (
      <Button variant="ghost" size="sm" className="hover:bg-destructive-soft hover:text-destructive" onClick={() => setToRevoke(c)}><ShieldOff />{t("devices.revoke")}</Button>
    ) },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.users")]} title={t("devices.certTitle")} description={t("devices.certDescription")} />
      <SectionCard>
        <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(c) => c.deviceCertificateId} searchText={(c) => c.deviceName} searchPlaceholder={t("devices.search")}
          empty={<EmptyState icon={<ShieldCheck />} title={t("devices.empty")} hint={t("devices.emptyHint")} />} />
      </SectionCard>
      <ConfirmDialog open={!!toRevoke} onOpenChange={(o) => !o && setToRevoke(null)} pending={revoke.isPending}
        title={t("devices.revokeTitle")} description={t("devices.revokeBody", { name: toRevoke?.deviceName })} confirmLabel={t("devices.revoke")}
        onConfirm={() => toRevoke && revoke.mutate(toRevoke.deviceCertificateId, { onSuccess: () => setToRevoke(null) })} />
    </>
  )
}
