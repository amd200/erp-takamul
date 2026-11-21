import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { activeBranchId, canManageAllBranches, useAuthStore } from "@/shared/auth/authStore"
import { useOpenShift, useShiftBranches, useShiftDevices, useShiftEmployees } from "../queries"

function Pick({ id, label, value, onChange, options, placeholder }: { id: string; label: string; value: number; onChange: (v: number) => void; options: { id: number; name: string }[]; placeholder: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value ? String(value) : undefined} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id={id} className="h-10 w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  )
}

/** Opening a shift needs a branch, the person working it, the device they sell on and the cash in the drawer. */
export function OpenShiftDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const multi = canManageAllBranches(session)
  const ownBranch = Number(session?.branchId) || 0
  const [branchId, setBranchId] = useState(0)
  const [employeeId, setEmployeeId] = useState(0)
  const [deviceId, setDeviceId] = useState(0)
  const [balance, setBalance] = useState("0")
  const [submitted, setSubmitted] = useState(false)
  const now = useMemo(() => new Date(), [open])

  const { data: branches = [] } = useShiftBranches(open && multi)
  const { data: employees = [] } = useShiftEmployees(branchId)
  const { data: devices = [] } = useShiftDevices(open)
  const run = useOpenShift()

  useEffect(() => {
    if (!open) return
    setSubmitted(false); setBalance("0"); setEmployeeId(0); setDeviceId(0)
    setBranchId(multi ? activeBranchId() ?? 0 : ownBranch)
  }, [open, multi, ownBranch])

  // Defaults once the lists arrive: the signed-in person if they work in this branch, the only device, the first branch.
  useEffect(() => { if (open && multi && !branchId && branches.length) setBranchId(branches[0].id) }, [open, multi, branchId, branches])
  useEffect(() => {
    if (!open || employeeId || !employees.length) return
    setEmployeeId(employees.find((e) => String(e.id) === session?.userId)?.id ?? employees[0].id)
  }, [open, employeeId, employees, session?.userId])
  useEffect(() => { if (open && !deviceId && devices.length === 1) setDeviceId(devices[0].id) }, [open, deviceId, devices])

  const amount = Number(balance)
  const invalid = !branchId || !employeeId || !deviceId || !Number.isFinite(amount) || amount < 0
  const submit = () => {
    setSubmitted(true)
    if (invalid) return
    run.mutate({ branchId, employeeId, deviceId, openingBalance: amount }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shifts.openTitle")}</DialogTitle>
          <DialogDescription>{t("shifts.openHint")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id="open-shift" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
            <FieldGroup className="gap-4">
              {/* Shown only: the server stamps the shift with its own date and time. */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>{t("shifts.date")}</FieldLabel>
                  <Input readOnly className="h-10 bg-muted" value={now.toLocaleDateString("en-EG")} />
                </Field>
                <Field>
                  <FieldLabel>{t("shifts.time")}</FieldLabel>
                  <Input readOnly className="h-10 bg-muted" value={now.toLocaleTimeString("en-EG", { hour: "2-digit", minute: "2-digit" })} />
                </Field>
              </div>
              {multi && <Pick id="shift-branch" label={t("shifts.branch")} value={branchId} onChange={(v) => { setBranchId(v); setEmployeeId(0) }} options={branches.map((b) => ({ id: b.id, name: b.name || String(b.id) }))} placeholder={t("reports.pick")} />}
              <Pick id="shift-employee" label={t("shifts.employee")} value={employeeId} onChange={setEmployeeId} options={employees.map((e) => ({ id: e.id, name: e.firstName }))} placeholder={t("reports.pick")} />
              <Pick id="shift-device" label={t("shifts.device")} value={deviceId} onChange={setDeviceId} options={devices.map((x) => ({ id: x.id, name: x.deviceName }))} placeholder={t("reports.pick")} />
              <Field data-invalid={submitted && (!Number.isFinite(amount) || amount < 0)}>
                <FieldLabel htmlFor="shift-balance">{t("shifts.openingBalance")}</FieldLabel>
                <Input id="shift-balance" type="number" inputMode="decimal" min={0} className="h-10" value={balance} onChange={(e) => setBalance(e.target.value)} />
                {submitted && (!Number.isFinite(amount) || amount < 0) && <FieldError>{t("validation.min0")}</FieldError>}
              </Field>
              {submitted && invalid && Number.isFinite(amount) && amount >= 0 && <p className="text-sm text-destructive">{t("shifts.fillAll")}</p>}
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="open-shift" disabled={run.isPending}>{t("shifts.open")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
