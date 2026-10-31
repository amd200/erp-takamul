import { useAppSettings } from "@/modules/settings"
import { ClassicDialog } from "./ClassicDialog"
import { CompactDialog } from "./CompactDialog"
import { MethodsDialog } from "./MethodsDialog"
import type { PaymentProps } from "./usePayment"

/** Shows the payment design chosen in Settings (sales, payment): the old, new or third design. */
export function PaymentScreen(props: PaymentProps) {
  const type = useAppSettings().paymentTab?.paymentScreenType
  if (type === "Type1") return <ClassicDialog {...props} />
  if (type === "Type3") return <CompactDialog {...props} />
  return <MethodsDialog {...props} />
}
