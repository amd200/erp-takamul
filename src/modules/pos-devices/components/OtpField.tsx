import { REGEXP_ONLY_DIGITS } from "input-otp"
import { useTranslation } from "react-i18next"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

/** The Fatoora OTP: six separate digit boxes, digits left to right even in RTL, numeric keyboard, paste works. */
export function OtpField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const { t } = useTranslation()
  return (
    <div dir="ltr" className="flex justify-center">
      <InputOTP maxLength={6} value={value} onChange={onChange} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" autoComplete="one-time-code"
        aria-label={t("devices.otp")} autoFocus={autoFocus} containerClassName="gap-0">
        <InputOTPGroup className="gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="size-11 rounded-lg border text-xl font-semibold tabular-nums sm:size-12" />)}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
