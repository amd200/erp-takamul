import { PageBox } from "@/components/PageBox"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PermissionTree } from "../components/PermissionTree"
import { useRole, useSaveRole } from "../queries"
import { roleSchema, type RoleForm } from "../schema"

/** Add or edit a permission (role), as in the current system: the name in one box, the pages tree in another, then the two buttons. */
export default function RoleFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  // A role is found by its id (a text) once it exists; its name cannot change.
  const editId = id
  const { data: role, isLoading } = useRole(editId)
  const save = useSaveRole()
  const form = useForm<RoleForm>({ resolver: zodResolver(roleSchema), defaultValues: { name: "", permissions: [] } })

  useEffect(() => { if (role) form.reset({ name: role.roleName, permissions: role.permissions }) }, [role, form])

  if (editId && isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />
  const submit = form.handleSubmit((data) => save.mutate({ roleId: editId, data: { roleName: data.name, permissions: data.permissions } }, { onSuccess: () => nav("/roles") }))
  const name = form.watch("name")

  return (
    <PageBox onSubmit={submit} title={t("oldRoles.addNew")} subtitle={t("oldRoles.selectPages")}
      action={<Button asChild variant="outline"><Link to="/roles">{t("oldRoles.back")}<ArrowLeft size={16} /></Link></Button>}>

      <div className="space-y-5">
        <div className="rounded-lg border p-5">
          <Label htmlFor="role-name" className="mb-2 block">{t("oldRoles.roleName")}</Label>
          <Input id="role-name" disabled={!!editId} placeholder={t("oldRoles.roleExample")} {...form.register("name")} />
          {form.formState.errors.name && <p className="mt-1 text-sm text-destructive">{t(form.formState.errors.name.message ?? "")}</p>}
        </div>

        <div className="overflow-hidden rounded-lg border p-5">
          <div className="mb-2 text-sm font-medium text-foreground">{t("oldRoles.pages")} <span className="text-destructive">*</span></div>
          <Controller control={form.control} name="permissions" render={({ field, fieldState }) => (
            <>
              {fieldState.error && <p className="mb-3 text-sm text-destructive">{t(fieldState.error.message!)}</p>}
              <PermissionTree value={field.value} onChange={field.onChange} />
            </>
          )} />
        </div>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <Button type="button" variant="destructive" size="xl" onClick={() => nav("/roles")}>{t("common.cancel")}</Button>
          <Button type="submit" size="xl" disabled={!name.trim() || save.isPending}>{t("oldRoles.save")}</Button>
        </div>
      </div>
    </PageBox>
  )
}
