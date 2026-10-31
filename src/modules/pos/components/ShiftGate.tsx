import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Clock, Loader2, RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/EmptyState"
import type { Shift } from "@/modules/shifts/types"
import { OpenShiftDialog } from "@/modules/shifts/components/OpenShiftDialog"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useCurrentShift } from "../queries"

/** Selling needs an open shift: without one the cashier screens only offer to open it. */
export function ShiftGate({ children }: { children: (shift: Shift) => ReactNode }) {
  const { t } = useTranslation()
  const shift = useCurrentShift()
  const [opening, setOpening] = useState(false)

  if (shift.isLoading) return <div className="grid h-dvh place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>
  if (shift.isError) {
    return (
      <div className="grid h-dvh place-items-center bg-background p-6">
        <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => shift.refetch()}>{t("common.retry")}</Button>} />
      </div>
    )
  }
  if (!shift.data) {
    return (
      <div className="grid h-dvh place-items-center bg-background p-6">
        <EmptyState icon={<Clock />} title={t("pos.noShift")} hint={t("pos.noShiftHint")} action={
          <div className="flex flex-wrap justify-center gap-2">
            <Can perm={P.shifts.open}><Button size="lg" onClick={() => setOpening(true)}>{t("shifts.open")}</Button></Can>
            <Button asChild size="lg" variant="outline"><Link to="/">{t("pos.exit")}</Link></Button>
          </div>
        } />
        <OpenShiftDialog open={opening} onOpenChange={setOpening} />
      </div>
    )
  }
  return <>{children(shift.data)}</>
}
