import { useState } from "react"
import { Banknote, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAppSettings } from "@/modules/settings"

/** Pulses the cash drawer through QZ Tray (loaded only when the button is used), on the branch's default printer. */
export function CashDrawerButton({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  const { t } = useTranslation()
  const printer = useAppSettings().print?.defultPrinter
  const [busy, setBusy] = useState(false)

  const open = async () => {
    setBusy(true)
    try {
      const { openCashDrawer } = await import("@/shared/printers/qz")
      await openCashDrawer(typeof printer === "string" ? printer : null)
      toast.success(t("pos.drawerOpened"))
    } catch {
      toast.error(t("pos.drawerFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="outline" size={iconOnly ? "icon" : "lg"} disabled={busy} onClick={open} title={t("pos.openDrawer")} aria-label={t("pos.openDrawer")} className={className}>
      {busy ? <Loader2 className="animate-spin" /> : <Banknote size={18} />}{!iconOnly && <span className="max-sm:hidden">{t("pos.openDrawer")}</span>}
    </Button>
  )
}
