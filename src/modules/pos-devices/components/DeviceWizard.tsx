import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, KeyRound, Loader2, Monitor, ShieldCheck, ShieldPlus, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { cn } from "@/lib/utils"
import { activeBranchId, useAuthStore } from "@/shared/auth/authStore"
import { useAppSettings } from "@/modules/settings"
import { useBranches } from "@/modules/lookups/service"
import { devicesApi } from "../service"
import { useDevices, useGenerateCsr, useRegisterCcsid, useRegisterPcsid, useSaveDevice } from "../queries"
import { deviceSchema, emptyDevice, type DeviceForm } from "../schema"
import type { DeviceStatus, PosDevice } from "../types"

const STEPS = [
  { id: 1, key: "info", icon: Monitor },
  { id: 2, key: "csr", icon: KeyRound },
  { id: 3, key: "ccsid", icon: ShieldCheck },
  { id: 4, key: "pcsid", icon: ShieldPlus },
] as const
// Where a device stands decides the step it resumes at; a device with a production certificate is done.
const stepFor: Record<DeviceStatus, number> = { NotRegistered: 2, PendingOTP: 3, CCSIDRegistered: 4, PCSIDRegistered: 5, Active: 5, Expired: 5, Revoked: 2 }
const registered = (s: DeviceStatus) => s === "PCSIDRegistered" || s === "Active"

function Stepper({ current }: { current: number }) {
  const { t } = useTranslation()
  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => {
        const done = current > s.id
        const active = current === s.id
        const Icon = done ? Check : s.icon
        return (
          <li key={s.id} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={active ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : current >= s.id ? "bg-brand-green" : "bg-border")} />
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border [&_svg]:size-4",
                done ? "border-brand-green bg-brand-green text-white" : active ? "border-primary bg-secondary text-secondary-foreground" : "text-faint")}>
                <Icon />
              </span>
              <span className={cn("h-px flex-1", i === STEPS.length - 1 ? "bg-transparent" : current > s.id ? "bg-brand-green" : "bg-border")} />
            </div>
            <span className={cn("text-xs", active ? "font-semibold" : "text-muted-foreground")}>{t(`devices.steps.${s.key}`)}</span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Add or edit a device, then walk it through ZATCA onboarding. Branches in tax stage 1 or
 * exempt from tax only need the device details. Reopening a half-registered device resumes
 * at its next step.
 */
export function DeviceWizard({ open, onOpenChange, device }: { open: boolean; onOpenChange: (o: boolean) => void; device: PosDevice | null }) {
  const { t } = useTranslation()
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const onboarding = taxSetting === "SecondStage"
  const { data: branches = [] } = useBranches()
  const { data: devices = [] } = useDevices()
  const save = useSaveDevice()
  const csr = useGenerateCsr()
  const ccsid = useRegisterCcsid()
  const pcsid = useRegisterPcsid()
  const [deviceId, setDeviceId] = useState<number | null>(null)
  // The OTP and production steps work on the device's certificate: it comes from the CSR step, or is looked up when resuming.
  const [certificateId, setCertificateId] = useState<number | null>(null)
  const sessionBranch = useAuthStore((x) => x.session?.branchId)
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState(false)
  const form = useForm<DeviceForm>({ resolver: zodResolver(deviceSchema), defaultValues: emptyDevice })

  const live = devices.find((d) => d.id === deviceId)
  const locked = !!live && live.status !== "NotRegistered" && live.status !== "Revoked"

  useEffect(() => {
    if (!open) return
    form.reset(device
      ? { deviceName: device.deviceName, serialNumber: device.serialNumber, invoiceSequence: device.invoiceSequence ?? "", branchId: device.branchId, isActive: device.isActive }
      : { ...emptyDevice, branchId: activeBranchId() ?? sessionBranch ?? 0 })
    setDeviceId(device?.id ?? null)
    setCertificateId(null)
    const resume = device && onboarding && !registered(device.status) ? stepFor[device.status] : 1
    setStep(resume)
    setOtp(""); setOtpError(false)
    if (!device) devicesApi.generateSerial().then((s) => form.setValue("serialNumber", s))
    // Resuming at the OTP or production step: find the certificate that step works on.
    if (device && (resume === 3 || resume === 4)) devicesApi.latestCertificate(device.id).then((c) => setCertificateId(c?.id ?? null))
  }, [open, device, form, onboarding, sessionBranch])

  const saveInfo = form.handleSubmit((data) =>
    save.mutate({ id: deviceId ?? undefined, data: { ...data, deviceTypeId: live?.deviceTypeId ?? device?.deviceTypeId } }, {
      onSuccess: (d) => {
        if (!onboarding || (device && registered(device.status))) return onOpenChange(false)
        setDeviceId(d.id)
        setStep(stepFor[d.status])
      },
    }))

  const busy = save.isPending || csr.isPending || ccsid.isPending || pcsid.isPending
  const next = () => {
    if (step === 1) return saveInfo()
    if (!deviceId) return
    if (step === 2) csr.mutate(deviceId, { onSuccess: (r) => { setCertificateId(r.certificateId); setStep(3) } })
    if (certificateId == null) return
    if (step === 3) ccsid.mutate({ certificateId, otp }, { onSuccess: () => setStep(4), onError: () => setOtpError(true) })
    if (step === 4) pcsid.mutate(certificateId, { onSuccess: () => setStep(5) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{device ? (step === 1 ? t("devices.edit") : t("devices.continue")) : t("devices.add")}</DialogTitle>
          <DialogDescription>{onboarding ? t("devices.onboardingHint") : t("devices.noOnboardingHint")}</DialogDescription>
        </DialogHeader>

        {onboarding && step < 5 && <Stepper current={step} />}

        {step === 1 && (
          <form id="device-form" onSubmit={saveInfo} noValidate>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput control={form.control} name="deviceName" required label={t("devices.name")} placeholder={t("devices.nameHint")} />
                <FormSelect control={form.control} name="branchId" numeric required label={t("users.branch")} options={branches.map((b) => ({ value: String(b.id), label: b.name ?? "" }))} />
                <FormInput control={form.control} name="serialNumber" required label={t("devices.serial")} dir="ltr" disabled={locked}
                  description={locked ? t("devices.lockedAfterCsr") : undefined}
                  end={!locked && <Button type="button" variant="outline" size="icon-lg" aria-label={t("devices.newSerial")}
                    onClick={() => devicesApi.generateSerial().then((s) => form.setValue("serialNumber", s, { shouldValidate: true }))}><Wand2 /></Button>} />
                <FormInput control={form.control} name="invoiceSequence" required label={t("devices.sequence")} dir="ltr" placeholder="CAI-3" description={t("devices.sequenceHint")} />
              </div>
            </FieldGroup>
          </form>
        )}

        {step === 2 && (
          <div className="rounded-xl bg-secondary/60 px-4 py-4 text-secondary-foreground">
            <div className="font-semibold">{t("devices.csrTitle")}</div>
            <p className="mt-1 text-sm">{t("devices.csrBody")}</p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">{t("devices.otpBody")}</p>
            <Input value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(false) }}
              inputMode="numeric" dir="ltr" autoComplete="one-time-code" aria-label={t("devices.otp")} aria-invalid={otpError}
              placeholder="••••••" className="h-12 max-w-48 text-center text-xl tracking-[0.5em]" />
            {otpError && <p className="text-sm text-destructive">{t("devices.otpInvalid")}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="rounded-xl bg-secondary/60 px-4 py-4 text-secondary-foreground">
            <div className="font-semibold">{t("devices.pcsidTitle")}</div>
            <p className="mt-1 text-sm">{t("devices.pcsidBody")}</p>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success"><Check className="size-6" /></span>
            <div className="font-semibold">{t("devices.doneTitle")}</div>
            <p className="max-w-sm text-muted-foreground">{t("devices.doneBody", { name: live?.deviceName })}</p>
          </div>
        )}

        <DialogFooter>
          {step === 5 ? (
            <Button onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{step > 1 ? t("devices.later") : t("common.cancel")}</Button>
              <Button onClick={next} disabled={busy || (step === 3 && otp.length !== 6) || (step > 2 && certificateId == null)}>
                {busy && <Loader2 className="animate-spin" />}
                {t(`devices.next.${step}`)}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
