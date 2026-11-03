import { useEffect, useState } from "react"
import { Copy, Loader2, QrCode } from "lucide-react"
import QRCode from "qrcode"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuthStore } from "@/shared/auth/authStore"

/** The customer's tracking page link for a final invoice: `/qr` on this origin with the branch and the invoice id. */
const invoiceQrLink = (invoiceId: number, branchId?: number | null) => `${window.location.origin}/qr?${branchId ? `branchId=${encodeURIComponent(branchId)}&` : ""}invoiceId=${invoiceId}`

/** A completed invoice's QR for the customer to scan (opens their invoice page and its push notifications), with the link to copy. */
export function InvoiceQrDialog({ invoiceId, onClose }: { invoiceId: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  const branchId = useAuthStore((st) => st.session?.branchId)
  const [dataUrl, setDataUrl] = useState("")
  const link = invoiceId ? invoiceQrLink(invoiceId, branchId) : ""

  useEffect(() => {
    if (!link) { setDataUrl(""); return }
    let cancelled = false
    QRCode.toDataURL(link, { width: 320, margin: 2 }).then((u) => { if (!cancelled) setDataUrl(u) }).catch(() => {})
    return () => { cancelled = true }
  }, [link])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t("pos1.linkCopied"))
    } catch {
      toast.error(t("common.loadFailed"))
    }
  }

  return (
    <Dialog open={invoiceId !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent aria-describedby={undefined} className="max-w-sm border-border bg-background p-6 text-foreground">
        <DialogTitle className="flex items-center gap-2 border-b border-border pb-3 text-[15px] font-semibold"><QrCode size={20} className="text-primary" />{t("pos1.invoiceQrTitle")}</DialogTitle>
        <div className="flex flex-col items-center gap-4 pt-1">
          {dataUrl ? <img src={dataUrl} alt="QR" className="size-64 rounded-lg bg-white p-1" /> : <Loader2 className="animate-spin" />}
          <p className="text-center text-xs text-muted-foreground">{t("pos1.invoiceQrHint")}</p>
          <button type="button" onClick={() => void copy()} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-xs text-foreground transition-colors hover:bg-muted"><Copy size={14} />{t("pos1.copyLink")}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
