import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PaymentStatus } from "../types"

const PAYMENT_VARIANT = { Paid: "success", Partial: "warning", Unpaid: "destructive", Refunded: "muted" } as const
const ZATCA_VARIANT = { Sent: "success", NotSentYet: "warning", Rejected: "destructive" } as const

const PAYMENT_STATES: PaymentStatus[] = ["Unpaid", "Partial", "Paid", "Refunded"]

export function PaymentBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation()
  const state = PAYMENT_STATES.find((x) => x === status)
  if (!state) return null
  return <Badge variant={PAYMENT_VARIANT[state]}>{t(`sales.payment.${state}`)}</Badge>
}

/** E-invoice (ZATCA phase 2) state; a rejection shows the authority's message on hover. */
export function ZatcaBadge({ status, message }: { status?: string | null; message?: string | null }) {
  const { t } = useTranslation()
  // The server leaves the state empty until the invoice is first sent.
  const state = status === "Sent" || status === "Rejected" ? status : "NotSentYet"
  const badge = <Badge variant={ZATCA_VARIANT[state]}>{t(`sales.zatca.${state}`)}</Badge>
  if (!message) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild><span tabIndex={0}>{badge}</span></TooltipTrigger>
      <TooltipContent className="max-w-xs">{message}</TooltipContent>
    </Tooltip>
  )
}
