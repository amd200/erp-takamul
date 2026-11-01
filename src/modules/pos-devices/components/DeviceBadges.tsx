import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import type { DeviceStatus } from "../types"

const STATUS_TONE = { Active: "success", PCSIDRegistered: "success", CCSIDRegistered: "warning", PendingOTP: "warning", NotRegistered: "neutral", Expired: "danger", Revoked: "danger" } as const

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  const { t } = useTranslation()
  return <StatusBadge tone={STATUS_TONE[status] ?? "neutral"}>{t(`devices.status.${status}`, { defaultValue: status })}</StatusBadge>
}

/** Expiry with urgency, from what the server reports: red once expired, amber within 30 days. */
export function ExpiryBadge({ expiresAt, daysLeft, expired }: { expiresAt?: string | null; daysLeft?: number | null; expired?: boolean }) {
  const { t, i18n } = useTranslation()
  if (!expiresAt) return <span className="text-faint">—</span>
  const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "numeric" }).format(new Date(expiresAt))
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{date}</span>
      {expired ? <StatusBadge tone="danger">{t("devices.expired")}</StatusBadge>
        : daysLeft != null && daysLeft <= 30 ? <StatusBadge tone="warning">{t("devices.daysLeft", { count: daysLeft })}</StatusBadge> : null}
    </span>
  )
}
