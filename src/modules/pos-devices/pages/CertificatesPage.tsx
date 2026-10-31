import { useState } from "react"
import { ShieldCheck, ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
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
  const { data, isLoading } = useCertificates()
  const revoke = useRevokeCertificate()
  const [toRevoke, setToRevoke] = useState<CertificateSummary | null>(null)

  const columns: Column<CertificateSummary>[] = [
    { id: "device", header: t("devices.name"), cell: (c) => <span className="font-semibold">{c.deviceName}</span> },
    { id: "type", header: t("devices.certType"), cell: (c) => (c.currentCertificateType ? <Badge variant={c.currentCertificateType === "PCSID" ? "secondary" : "warning"}>{t(`devices.certTypes.${c.currentCertificateType}`, { defaultValue: c.currentCertificateType })}</Badge> : <span className="text-faint">—</span>) },
    { id: "status", header: t("devices.registration"), cell: (c) => (c.isExpired ? <Badge variant="destructive">{t("devices.expired")}</Badge> : c.hasActiveCertificate ? <Badge variant="success">{t("common.active")}</Badge> : <Badge variant="muted">{t("common.inactive")}</Badge>) },
    { id: "expiry", header: t("devices.certExpiry"), cell: (c) => <ExpiryBadge expiresAt={c.expiresAt} daysLeft={c.daysUntilExpiry} expired={c.isExpired} /> },
    { id: "actions", header: "", align: "end", cell: (c) => can(P.certificates.delete) && (
      <Button variant="ghost" size="sm" className="hover:bg-destructive-soft hover:text-destructive" onClick={() => setToRevoke(c)}><ShieldOff />{t("devices.revoke")}</Button>
    ) },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.users")]} title={t("devices.certTitle")} description={t("devices.certDescription")} />
      <SectionCard>
        <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(c) => c.deviceCertificateId} searchText={(c) => c.deviceName} searchPlaceholder={t("devices.search")}
          empty={<EmptyState icon={<ShieldCheck />} title={t("devices.empty")} hint={t("devices.emptyHint")} />} />
      </SectionCard>
      <ConfirmDialog open={!!toRevoke} onOpenChange={(o) => !o && setToRevoke(null)} pending={revoke.isPending}
        title={t("devices.revokeTitle")} description={t("devices.revokeBody", { name: toRevoke?.deviceName })} confirmLabel={t("devices.revoke")}
        onConfirm={() => toRevoke && revoke.mutate(toRevoke.deviceCertificateId, { onSuccess: () => setToRevoke(null) })} />
    </>
  )
}
