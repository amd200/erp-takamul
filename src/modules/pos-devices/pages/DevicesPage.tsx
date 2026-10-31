import { useState } from "react"
import { Monitor, Plus, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAppSettings } from "@/modules/settings"
import { DeviceStatusBadge, ExpiryBadge } from "../components/DeviceBadges"
import { DeviceWizard } from "../components/DeviceWizard"
import { useDeleteDevice, useDevices } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { DeviceStatus, PosDevice } from "../types"

const registered = (s: DeviceStatus) => s === "PCSIDRegistered" || s === "Active"

export default function DevicesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const { data, isLoading } = useDevices()
  const del = useDeleteDevice()
  const [editing, setEditing] = useState<PosDevice | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<PosDevice | null>(null)
  const show = (d: PosDevice | null) => { setEditing(d); setOpen(true) }
  const onboarding = taxSetting === "SecondStage"

  const columns: Column<PosDevice>[] = [
    { id: "name", header: t("devices.name"), cell: (d) => (
      <div>
        <div className="flex items-center gap-2 font-semibold">{d.deviceName}{!d.isActive && <Badge variant="muted">{t("common.inactive")}</Badge>}</div>
        <div className="text-xs text-faint" dir="ltr">{d.invoiceSequence}</div>
      </div>
    ) },
    { id: "branch", header: t("users.branch"), cell: (d) => d.branchName || "—" },
    ...(onboarding ? [
      { id: "status", header: t("devices.registration"), cell: (d: PosDevice) => (
        <div className="flex flex-wrap items-center gap-2">
          <DeviceStatusBadge status={d.status} />
          {!registered(d.status) && can(P.posDevices.edit) && (
            <Button variant="link" size="sm" className="h-auto px-0" onClick={() => show(d)}>{t("devices.completeRegistration")}</Button>
          )}
        </div>
      ) },
      { id: "cert", header: t("devices.certExpiry"), cell: (d: PosDevice) => <ExpiryBadge expiresAt={d.certificateExpiresAt} daysLeft={d.daysUntilExpiry} expired={d.isCertificateExpired} /> },
    ] : []),
    { id: "icv", header: t("devices.lastIcv"), cell: (d) => (d.currentICV ? <span className="tabular-nums">{d.currentICV}</span> : <span className="text-faint">—</span>) },
    { id: "actions", header: "", align: "end", cell: (d) => (
      <RowActions onEdit={can(P.posDevices.edit) ? () => show(d) : undefined} onDelete={can(P.posDevices.delete) ? () => setToDelete(d) : undefined} />
    ) },
  ]

  const needsAttention = (data ?? []).filter((d) => onboarding && !registered(d.status)).length

  return (
    <>
      <PageHeader crumbs={[t("nav.users")]} title={t("devices.title")} description={t("devices.description")}
        actions={<Can perm={P.posDevices.add}><Button size="lg" onClick={() => show(null)}><Plus />{t("devices.add")}</Button></Can>} />
      {needsAttention > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-warning">
          <ShieldCheck className="size-4 shrink-0" />{t("devices.attention", { count: needsAttention })}
        </div>
      )}
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(d) => d.id}
            searchText={(d) => `${d.deviceName} ${d.serialNumber} ${d.invoiceSequence ?? ""}`} searchPlaceholder={t("devices.search")}
            empty={<EmptyState icon={<Monitor />} title={t("devices.empty")} hint={t("devices.emptyHint")} />} />
        </SectionCard>
      <DeviceWizard open={open} onOpenChange={setOpen} device={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("devices.deleteTitle")} description={t("devices.deleteBody", { name: toDelete?.deviceName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
