import type { ElementType, ReactNode } from "react"
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, ShieldX, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type StatusType = "PASS" | "WARNING" | "ERROR"
type ZatcaMessage = { type: string; code: string; category: string; message: string; status: StatusType }
type ValidationResults = { infoMessages: ZatcaMessage[]; warningMessages: ZatcaMessage[]; errorMessages: ZatcaMessage[]; status: StatusType }
type ZatcaResponse = { validationResults?: ValidationResults; reportingStatus?: string }

/** The server keeps ZATCA's answer as a JSON string; anything that does not parse shows as "no messages". */
function parse(raw: string | null | undefined): ZatcaResponse | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ZatcaResponse } catch { return null }
}

const statusConfig: Record<StatusType, { label: string; labelAr: string; icon: ElementType; containerClass: string; textClass: string; badgeClass: string }> = {
  PASS: { label: "PASS", labelAr: "ناجح", icon: ShieldCheck, containerClass: "bg-[#00e6821a] border border-[#09ad9533]", textClass: "text-[#09ad95]", badgeClass: "bg-[#09ad9520] text-[#09ad95]" },
  WARNING: { label: "WARNING", labelAr: "تحذير", icon: AlertTriangle, containerClass: "bg-[#fff3cd1a] border border-[#ffc10733]", textClass: "text-[#e6a817]", badgeClass: "bg-[#ffc10720] text-[#e6a817]" },
  ERROR: { label: "ERROR", labelAr: "مرفوض", icon: ShieldX, containerClass: "bg-[#f50b0b1a] border border-[#f50b0b33]", textClass: "text-[#b40b09]", badgeClass: "bg-[#f50b0b20] text-[#b40b09]" },
}

function MessageList({ icon, label, messages, badgeClass }: { icon: ReactNode; label: string; messages: ZatcaMessage[]; badgeClass?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">{icon}{label}</div>
      <div className="pr-6">
        <ul className="space-y-2">
          {messages.map((msg, i) => (
            <li key={i} className="flex flex-col gap-0.5">
              {badgeClass ? (
                <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${badgeClass}`}><CheckCircle2 size={12} />{msg.message}</div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                  <span>{msg.message}</span>
                </div>
              )}
              {msg.code && <span className="pr-4 text-[10px] text-muted-foreground opacity-60">[{msg.code}] — {msg.category}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** ZATCA's answer for one document (invoice, return or debit note), laid out like the current system. */
export function ZatcaResponseDialog({ doc, onOpenChange }: { doc: { number?: string | null; zatcaStatus?: string | null; zatcaResponse?: string | null } | null; onOpenChange: (open: boolean) => void }) {
  const validation = parse(doc?.zatcaResponse)?.validationResults
  const status: StatusType = doc?.zatcaStatus === "Sent" ? validation?.status ?? "PASS" : doc?.zatcaStatus === "NotSentYet" ? "WARNING" : "ERROR"
  const config = statusConfig[status] ?? statusConfig.PASS
  const StatusIcon = config.icon
  const errors = validation?.errorMessages ?? []
  const warnings = validation?.warningMessages ?? []
  const infos = validation?.infoMessages ?? []

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-right text-base font-semibold">
            متابعة رد هيئة الزكاة والدخل لفاتورة رقم <span className="font-bold">{doc?.number ?? "—"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <div className="text-right">
            <p className="text-xs font-semibold leading-tight text-foreground">هيئة الزكاة والضريبة والجمارك</p>
            <p className="text-[10px] text-muted-foreground">Zakat, Tax and Customs Authority</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${config.containerClass}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-sm font-semibold ${config.textClass}`}><StatusIcon size={18} />{config.labelAr} ({config.label})</div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}>حالة الرد</span>
          </div>
          <div className="space-y-4">
            {errors.length > 0 && <MessageList icon={<XCircle size={14} className="text-[#b40b09]" />} label="رسائل الخطأ" messages={errors} />}
            {warnings.length > 0 && <MessageList icon={<AlertTriangle size={14} className="text-[#e6a817]" />} label="رسائل التحذير" messages={warnings} />}
            {infos.length > 0 && <MessageList icon={<Info size={14} className="text-muted-foreground" />} label="رد زاتكا" messages={infos} badgeClass={config.badgeClass} />}
            {errors.length === 0 && warnings.length === 0 && infos.length === 0 && <p className="py-2 text-center text-sm text-muted-foreground">لا توجد رسائل</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
