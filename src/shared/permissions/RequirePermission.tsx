import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import type { Permission } from "./permissions"
import { useCan } from "./usePermission"

/** Guard: renders its children (or, as a route element, the child routes) only for users holding the permission. */
export function RequirePermission({ perm, children }: { perm: Permission | Permission[]; children?: ReactNode }) {
  const { t } = useTranslation()
  if (useCan()(perm)) return children ?? <Outlet />
  return <Card><EmptyState icon={<ShieldOff />} title={t("common.noAccess")} hint={t("common.noAccessHint")} /></Card>
}
