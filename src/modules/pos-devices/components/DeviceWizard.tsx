import { useEffect, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, KeyRound, Loader2, Monitor, ShieldCheck, ShieldPlus, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { cn } from "@/lib/utils"
import { activeBranchId, useAuthStore } from "@/shared/auth/authStore"
import { useAppSettings } from "@/modules/settings"
import { useBranches } from "@/modules/lookups/service"
import { devicesApi } from "../service"
import { errorToast } from "@/shared/api/errors"
import { useDevices, useGenerateCsr, useRegisterCcsid, useRegisterPcsid, useSaveDevice } from "../queries"
import { deviceSchema, emptyDevice, type DeviceForm } from "../schema"
import type { DeviceStatus, PosDevice } from "../types"
import { DeviceSection, DeviceHero } from "./DeviceHero"
import { DeviceStatusBadge } from "./DeviceBadges"

const STEPS = [
  { id: 1, key: "info", icon: Monitor },
  { id: 2, key: "csr", icon: KeyRound },
  { id: 3, key: "ccsid", icon: ShieldCheck },
  { id: 4, key: "pcsid", icon: ShieldPlus },
] as const
// Where a device stands decides the step it resumes at; a device with a production certificate is done.
const stepFor: Record<DeviceStatus, number> = { NotRegistered: 2, PendingOTP: 3, CCSIDRegistered: 4, PCSIDRegistered: 5, Active: 5, Expired: 5, Revoked: 2 }
const registered = (s: DeviceStatus) => s === "PCSIDRegistered" || s === "Active"

/**
 * The onboarding as a vertical timeline: finished steps get a green tick, the current one a ringed icon and its content
 * opens right under its title, the rest wait greyed out.
 */
function Timeline({ current, content }: { current: number; content: Partial<Record<number, ReactNode>> }) {
  const { t } = useTranslation()
  return (
    <ol className="rounded-xl border bg-card p-4 shadow-xs">
      {STEPS.map((s, i) => {
        const done = current > s.id
        const active = current === s.id
        const Icon = done ? Check : s.icon
        return (
          <li key={s.id} className="flex gap-3" aria-current={active ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors [&_svg]:size-4",
                done ? "border-brand-green bg-brand-green text-white" : active ? "border-primary bg-secondary text-secondary-foreground ring-4 ring-primary/15" : "border-border bg-background text-faint")}>
                <Icon />
              </span>
              {i < STEPS.length - 1 && <span className={cn("my-1 min-h-3 w-0.5 flex-1 rounded-full", done ? "bg-brand-green" : "bg-border")} />}
            </div>
            <div className={cn("min-w-0 flex-1", i < STEPS.length - 1 && "pb-4")}>
              <div className={cn("flex min-h-9 items-center text-sm", active ? "font-semibold" : done ? "font-medium text-foreground" : "text-muted-foreground")}>{t(`devices.steps.${s.key}`)}</div>
              {active && content[s.id] && <div className="mt-2">{content[s.id]}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Text of a step, in a soft tinted box. */
function StepNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-4 py-3 text-secondary-foreground">
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  )
}

/**
 * Add or edit a device, then walk it through ZATCA onboarding. Branches in tax stage 1 or
 * exempt from tax only need the device details. Reopening a half-registered device resumes
 * at its next step. Laid out as erpv2-modern's DeviceWizard.
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
    setOtp("")
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
    const fail = (e: unknown) => errorToast(e, "common.saveFailed")
    if (step === 2) csr.mutate(deviceId, { onSuccess: (r) => { setCertificateId(r.certificateId); setStep(3) }, onError: fail })
    if (certificateId == null) return
    if (step === 3) ccsid.mutate({ certificateId, otp }, { onSuccess: () => setStep(4), onError: fail })
    if (step === 4) pcsid.mutate(certificateId, { onSuccess: () => setStep(5), onError: fail })
  }

  const nameValue = form.watch("deviceName")
  const title = device ? (step === 1 ? t("devices.edit") : t("devices.continue")) : t("devices.add")
  const fields = (
    <form id="device-form" onSubmit={saveInfo} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="deviceName" required label={t("devices.name")} placeholder={t("devices.nameHint")} />
          <FormSelect control={form.control} name="branchId" numeric required label={t("users.branch")} options={branches.map((b) => ({ value: String(b.id), label: b.name ?? "" }))} />
          <FormInput control={form.control} name="serialNumber" required label={t("devices.serial")} dir="ltr" disabled={locked}
            description={locked ? t("devices.lockedAfterCsr") : undefined}
            end={!locked && <Button type="button" variant="outline" size="icon-lg" aria-label={t("devices.newSerial")} title={t("devices.newSerial")}
              onClick={() => devicesApi.generateSerial().then((s) => form.setValue("serialNumber", s, { shouldValidate: true }))}><Wand2 /></Button>} />
          <FormInput control={form.control} name="invoiceSequence" required label={t("devices.sequence")} dir="ltr" placeholder="CAI-3" description={t("devices.sequenceHint")} />
        </div>
      </FieldGroup>
    </form>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DeviceHero icon={step === 5 ? Check : Monitor} title={title} description={onboarding ? t("devices.onboardingHint") : t("devices.noOnboardingHint")}
          badge={live ? <DeviceStatusBadge status={live.status} /> : nameValue ? <span className="max-w-48 truncate rounded-full bg-background px-2.5 py-0.5 text-xs font-medium ring-1 ring-border">{nameValue}</span> : undefined} />
        <DialogBody className="flex max-h-[60vh] flex-col gap-4">
          {step === 5 && (
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-success">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-white"><Check className="size-5" /></span>
              <div className="min-w-0">
                <div className="font-semibold">{t("devices.doneTitle")}</div>
                <p className="text-sm">{t("devices.doneBody", { name: live?.deviceName })}</p>
              </div>
            </div>
          )}

          {onboarding ? (
            <Timeline current={step} content={{
              1: fields,
              2: <StepNote title={t("devices.csrTitle")} body={t("devices.csrBody")} />,
              3: (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{t("devices.otpBody")}</p>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric" dir="ltr" autoComplete="one-time-code" aria-label={t("devices.otp")}
                    placeholder="••••••" className="h-12 max-w-48 text-center text-xl tracking-[0.5em]" />
                </div>
              ),
              4: <StepNote title={t("devices.pcsidTitle")} body={t("devices.pcsidBody")} />,
            }} />
          ) : (
            <DeviceSection>{fields}</DeviceSection>
          )}
        </DialogBody>
        <DialogFooter className="bg-muted/50">
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
