import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PaymentStatus } from "../types"

const PAYMENT_TONE = { Paid: "success", Partial: "warning", Unpaid: "danger", Refunded: "refunded" } as const
const ZATCA_TONE = { Sent: "success", NotSentYet: "danger", Rejected: "danger" } as const

const PAYMENT_STATES: PaymentStatus[] = ["Unpaid", "Partial", "Paid", "Refunded"]

export function PaymentBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation()
  const state = PAYMENT_STATES.find((x) => x === status)
  if (!state) return null
  return <StatusBadge tone={PAYMENT_TONE[state]}>{t(`sales.payment.${state}`)}</StatusBadge>
}

/** E-invoice (ZATCA phase 2) state; a rejection shows the authority's message on hover. */
export function ZatcaBadge({ status, message }: { status?: string | null; message?: string | null }) {
  const { t } = useTranslation()
  // The server leaves the state empty until the invoice is first sent.
  const state = status === "Sent" || status === "Rejected" ? status : "NotSentYet"
  const badge = <StatusBadge tone={ZATCA_TONE[state]}>{t(`sales.zatca.${state}`)}</StatusBadge>
  if (!message) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild><span tabIndex={0}>{badge}</span></TooltipTrigger>
      <TooltipContent className="max-w-xs">{message}</TooltipContent>
    </Tooltip>
  )
}
