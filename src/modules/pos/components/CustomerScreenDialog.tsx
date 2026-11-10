import { useMemo, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { Check, Copy, ExternalLink, Tv } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthStore } from "@/shared/auth/authStore"
import { devicesApi } from "@/modules/pos-devices/service"
import { deviceKeys } from "@/modules/pos-devices/keys"

/**
 * The link to the customer's own ordering screen (/pos4) for this cashier's device, as in the current POS: the device
 * comes from the `DeviceId` claim of the sign-in token and is named from /pos-devices.
 */
export function CustomerScreenDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.accessToken)
  const branchId = useAuthStore((s) => s.session?.branchId)
  const [copied, setCopied] = useState(false)
  const deviceId = useMemo(() => {
    if (!token) return ""
    try {
      const c = jwtDecode<{ DeviceId?: string | number; deviceId?: string | number }>(token)
      return String(c.DeviceId ?? c.deviceId ?? "")
    } catch { return "" }
  }, [token])
  const devices = useQuery({ queryKey: deviceKeys.list(), queryFn: () => devicesApi.list(), enabled: open })
  const device = deviceId ? (devices.data ?? []).find((d) => String(d.id) === deviceId) : undefined
  const name = device?.deviceName ?? deviceId
  const link = `${window.location.origin}/pos4?${branchId ? `branchId=${branchId}&` : ""}posDeviceName=${encodeURIComponent(name)}`
  const shown = devices.isLoading ? t("common.loading") : device ? device.deviceName : deviceId ? `${t("pos1.device")} #${deviceId}` : t("pos1.noDevice")

  const copy = async () => {
    if (!name) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success(t("pos1.linkCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch { /* the browser refused the clipboard */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-background p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-foreground/80"><Tv size={20} className="text-primary" />{t("pos1.customerScreenConfig")}</DialogTitle>
          <DialogDescription className="sr-only">{t("pos1.customerScreenConfig")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 pt-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">{t("pos1.cashierDevice")}</label>
            <div className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-foreground"><span>{shown}</span></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">{t("pos1.linkUrl")}</label>
            <div dir="ltr" className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-left font-mono text-[11px] break-all text-muted-foreground select-all">{name ? link : "---"}</div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="h-11 gap-2 text-xs" onClick={copy} disabled={!name}>
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}{copied ? t("pos1.copied") : t("pos1.copyLink")}
            </Button>
            <Button className="h-11 gap-2 text-xs text-white" disabled={!name} onClick={() => { window.open(link, "_blank"); onOpenChange(false) }}>
              <ExternalLink size={14} />{t("pos1.saveAndOpen")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
