import { Loader2, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/SectionCard"
import { useInvoices } from "@/modules/sales/queries"
import { useResendUnsent } from "../queries"

/** Phase 2 maintenance: push every invoice that hasn't reached ZATCA yet. */
export function ZatcaPanel({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const { data: invoices = [] } = useInvoices()
  const resend = useResendUnsent()
  const unsent = invoices.filter((i) => i.zatcaStatus !== "Sent")
  const rejected = unsent.filter((i) => i.zatcaStatus === "Rejected").length

  return (
    <SectionCard title={t("settings.g.zatcaResend")} description={t("settings.gh.zatcaResend")}>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-4">
        <div>
          <div className="text-2xl font-bold tabular-nums">{unsent.length}</div>
          <div className="text-sm text-muted-foreground">{t("settings.unsentCount", { rejected })}</div>
        </div>
        <Button size="lg" disabled={readOnly || unsent.length === 0 || resend.isPending} onClick={() => resend.mutate()}>
          {resend.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          {resend.isPending ? t("settings.resending") : t("settings.resendNow")}
        </Button>
      </div>
      {resend.data && (
        <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-success" role="status">
          {t("settings.resendResult", { total: resend.data.total, sent: resend.data.sent, failed: resend.data.failed })}
        </p>
      )}
    </SectionCard>
  )
}
