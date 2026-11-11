import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { useSession } from "@/shared/session/session"
import { useBranchList } from "@/modules/branches/queries"
import { useRoleNames, useSaveUser } from "../queries"
import { buildUserSchema, emptyUser, type UserForm } from "../schema"
import type { User } from "../types"

/**
 * Add or edit a user, as in the current system: a pop-up with user name, mobile, email, branch, role, the password and
 * its confirmation (new users only), and a box for working on several branches.
 */
export function UserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: User | null }) {
  const { t } = useTranslation()
  const { data: roles = [] } = useRoleNames()
  const { data: branches = [] } = useBranchList()
  const { branch } = useSession()
  const save = useSaveUser()
  const form = useForm<UserForm>({ resolver: zodResolver(buildUserSchema(!user)), defaultValues: emptyUser })
  const multi = form.watch("isMultiBranch")

  useEffect(() => {
    if (open) form.reset(user ? { ...emptyUser, name: user.firstName || user.userName || "", userName: user.userName ?? "", email: user.email ?? "", mobile: user.mobile ?? "", branchId: user.branchId ?? 0, roleName: user.roleName || user.roles?.[0]?.roleName || "", isMultiBranch: user.isMultiBranch ?? false, password: "", confirmPassword: "" } : { ...emptyUser, branchId: branch.id ?? 0 })
  }, [open, user, form, branch.id])

  // The pop-up asks for a user name, not a display name: a new user is shown under their user name.
  const submit = form.handleSubmit(({ confirmPassword: _c, password, ...data }) =>
    save.mutate({ id: user?.id, data: { ...data, name: user ? data.name : data.userName, password: password || undefined } }, { onSuccess: () => onOpenChange(false) }))
  const c = form.control
  const title = user ? t("oldUsers.edit") : t("oldUsers.add")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary"><UserPlus size={20} />{title}</DialogTitle>
          <DialogDescription>{t("oldUsers.subtitle")}</DialogDescription>
        </DialogHeader>
        <DialogBody>

          <form id="user-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput control={c} name="userName" required label={t("oldUsers.userName")} placeholder={t("oldUsers.userNameHint")} />
            <FormInput control={c} name="mobile" label={t("oldUsers.mobile")} placeholder={t("oldUsers.mobileExample")} />
            <FormInput control={c} name="email" required label={t("oldUsers.email")} placeholder="example@email.com" />
            <FormSelect control={c} name="branchId" numeric required label={t("oldUsers.branch")} placeholder={t("oldUsers.chooseBranch")}
              options={branches.map((b) => ({ value: String(b.id), label: b.name || String(b.id) }))} />
            <div className="sm:col-span-2">
              <FormSelect control={c} name="roleName" required label={t("oldUsers.permission")} placeholder={t("oldUsers.choosePermission")}
                options={roles.map((r) => ({ value: r, label: r }))} />
            </div>
            {!user && <FormInput control={c} name="password" type="password" required label={t("oldUsers.password")} placeholder={t("oldUsers.passwordHint")} />}
            {!user && <FormInput control={c} name="confirmPassword" type="password" required label={t("oldUsers.confirmPassword")} placeholder={t("oldUsers.rewritePassword")} />}

            <div className="rounded-lg border border-border p-3 sm:col-span-2">
              <div className="flex items-start gap-3">
                <Checkbox id="user-multi-branch" className="mt-0.5" checked={multi === true} onCheckedChange={(v) => form.setValue("isMultiBranch", v === true)} />
                <div className="space-y-1">
                  <label htmlFor="user-multi-branch" className="cursor-pointer text-sm font-medium">{t("oldUsers.multiBranch")}</label>
                  <p className="text-xs text-muted-foreground">{t("oldUsers.multiBranchHint")}</p>
                </div>
              </div>
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="user-form" disabled={save.isPending}>{title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
