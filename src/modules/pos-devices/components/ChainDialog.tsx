import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { FormInput } from "@/components/form/FormFields"
import { useUpdateChain } from "../queries"
import { chainSchema, type ChainForm } from "../schema"
import type { PosDevice } from "../types"

/** Sets the invoice counter (ICV) and previous hash (PIH) of a device, as /pos-devices/{id}/update-chain does. */
export function ChainDialog({ device, onClose }: { device: PosDevice | null; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useUpdateChain()
  const form = useForm<ChainForm>({ resolver: zodResolver(chainSchema), defaultValues: { newICV: 0, newPIH: "" } })
  useEffect(() => { if (device) form.reset({ newICV: device.currentICV, newPIH: device.lastPIH ?? "" }) }, [device, form])

  const submit = form.handleSubmit((d) => device && save.mutate({ deviceId: device.id, ...d }, { onSuccess: onClose }))

  return (
    <Dialog open={!!device} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("devices.chainTitle")} — {device?.deviceName}</DialogTitle>
          <DialogDescription>{t("devices.chainHint")}</DialogDescription>
        </DialogHeader>
        <form id="chain-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            <FormInput control={form.control} name="newICV" type="number" required label={t("devices.newIcv")} dir="ltr" />
            <FormInput control={form.control} name="newPIH" required label={t("devices.newPih")} dir="ltr" />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" form="chain-form" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />}{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
