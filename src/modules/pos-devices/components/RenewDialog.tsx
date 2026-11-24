import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { errorToast } from "@/shared/api/errors"
import { useRenewCertificate } from "../queries"
import type { CertificateSummary } from "../types"

/** Renews a device's certificate with a fresh OTP from the Fatoora portal. Same frame as the device wizard. */
export function RenewDialog({ cert, onClose }: { cert: CertificateSummary | null; onClose: () => void }) {
  const { t } = useTranslation()
  const renew = useRenewCertificate()
  const [otp, setOtp] = useState("")
  useEffect(() => { if (cert) setOtp("") }, [cert])

  return (
    <Dialog open={!!cert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-semibold">{t("devices.renewTitle")}</DialogTitle>
          <DialogDescription>{t("devices.renewBody", { name: cert?.deviceName })}</DialogDescription>
        </DialogHeader>
        <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" autoComplete="one-time-code"
          aria-label={t("devices.otp")} placeholder="••••••" className="h-12 max-w-48 text-center text-xl tracking-[0.5em]" />
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
