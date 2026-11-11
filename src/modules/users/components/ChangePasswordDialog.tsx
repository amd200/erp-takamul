import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormInput } from "@/components/form/FormFields"
import { useAuthStore } from "@/shared/auth/authStore"
import { useChangePassword } from "../queries"
import { changePasswordSchema, type ChangePasswordForm } from "../schema"

/** The signed-in user changes their own password: the new one and its confirmation, as in the current system. */
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.session?.userId)
  const change = useChangePassword()
  const form = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema), defaultValues: { password: "", confirmPassword: "" } })

  useEffect(() => {
    if (open) form.reset({ password: "", confirmPassword: "" })
  }, [open, form])

  const submit = form.handleSubmit(({ password }) =>
    change.mutate({ employeeId: Number(userId), password }, { onSuccess: () => onOpenChange(false) }))
  const c = form.control

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary"><KeyRound size={20} />{t("topbar.changePassword")}</DialogTitle>
          <DialogDescription className="sr-only">{t("topbar.changePassword")}</DialogDescription>
        </DialogHeader>
        <DialogBody>

          <form id="change-password-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
            <FormInput control={c} name="password" type="password" required autoComplete="new-password" label={t("topbar.newPassword")} placeholder={t("topbar.newPasswordHint")} />
            <FormInput control={c} name="confirmPassword" type="password" required autoComplete="new-password" label={t("oldUsers.confirmPassword")} placeholder={t("topbar.rewriteNewPassword")} />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="change-password-form" disabled={change.isPending}>{t("topbar.changePassword")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
