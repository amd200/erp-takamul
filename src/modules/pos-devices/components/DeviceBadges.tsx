import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import type { DeviceStatus } from "../types"

const STATUS_VARIANT = { Active: "success", PCSIDRegistered: "success", CCSIDRegistered: "warning", PendingOTP: "warning", NotRegistered: "muted", Expired: "destructive", Revoked: "destructive" } as const

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  const { t } = useTranslation()
  return <Badge variant={STATUS_VARIANT[status] ?? "muted"}>{t(`devices.status.${status}`, { defaultValue: status })}</Badge>
}

/** Expiry with urgency, from what the server reports: red once expired, amber within 30 days. */
export function ExpiryBadge({ expiresAt, daysLeft, expired }: { expiresAt?: string | null; daysLeft?: number | null; expired?: boolean }) {
  const { t, i18n } = useTranslation()
  if (!expiresAt) return <span className="text-faint">—</span>
  const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "numeric" }).format(new Date(expiresAt))
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{date}</span>
      {expired ? <Badge variant="destructive">{t("devices.expired")}</Badge>
        : daysLeft != null && daysLeft <= 30 ? <Badge variant="warning">{t("devices.daysLeft", { count: daysLeft })}</Badge> : null}
    </span>
  )
}
