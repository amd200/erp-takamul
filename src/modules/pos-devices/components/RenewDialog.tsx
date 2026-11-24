import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { errorToast } from "@/shared/api/errors"
import { useRenewCertificate } from "../queries"
import type { CertificateSummary } from "../types"
import { DeviceHero, DeviceSection } from "./DeviceHero"

/** Renews a device's certificate with a fresh OTP from the Fatoora portal. Same look as the device wizard. */
export function RenewDialog({ cert, onClose }: { cert: CertificateSummary | null; onClose: () => void }) {
  const { t } = useTranslation()
  const renew = useRenewCertificate()
  const [otp, setOtp] = useState("")
  useEffect(() => { if (cert) setOtp("") }, [cert])

  return (
    <Dialog open={!!cert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DeviceHero icon={RefreshCw} title={t("devices.renewTitle")} description={t("devices.renewBody", { name: cert?.deviceName })}
          badge={cert?.currentCertificateType ? <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium ring-1 ring-border">{cert.currentCertificateType}</span> : undefined} />
        <DeviceSection>
          <div className="flex justify-center">
            <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" autoComplete="one-time-code"
              aria-label={t("devices.otp")} placeholder="••••••" className="h-12 max-w-48 text-center text-xl tracking-[0.5em]" />
          </div>
        </DeviceSection>
        <DialogFooter className="bg-muted/50">
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={renew.isPending || otp.length !== 6 || !cert}
            onClick={() => cert && renew.mutate({ certificateId: cert.deviceCertificateId, otp }, {
              onSuccess: () => { toast.success(t("devices.certRenewed")); onClose() },
              onError: (e) => errorToast(e, "common.saveFailed"),
            })}>
            {renew.isPending && <Loader2 className="animate-spin" />}{t("devices.renew")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
