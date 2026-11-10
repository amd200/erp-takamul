import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IdCard, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { SectionCard } from "@/components/SectionCard"
import { canManageAllBranches, useAuthStore } from "@/shared/auth/authStore"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { useBranches } from "@/modules/lookups/service"
import { useDeleteEmployee, useEmployeeList, useSaveEmployee } from "../queries"
import { emptyEmployee, employeeSchema, type EmployeeForm } from "../schema"
import type { Employee } from "../types"

/** Name and mobile; a user who may work across branches also picks the employee's branch (a new employee in a box at the top, a saved one in a field below). */
function EmployeeDialog({ open, onOpenChange, employee }: { open: boolean; onOpenChange: (o: boolean) => void; employee: Employee | null }) {
  const { t } = useTranslation()
  const canPickBranch = useAuthStore((s) => canManageAllBranches(s.session))
  const { data: branches = [] } = useBranches()
  const save = useSaveEmployee()
  const formBranch = useFormBranch(open && !employee)
  const form = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema), defaultValues: emptyEmployee })
  useEffect(() => {
    if (open) form.reset(employee ? { firstName: employee.firstName ?? "", mobile: employee.mobile ?? "", branchId: employee.branchId ?? undefined } : emptyEmployee)
  }, [open, employee, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: employee?.id, data: { ...data, branchId: canPickBranch ? (employee ? data.branchId : formBranch.branchId ?? undefined) : undefined } }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{employee ? t("employees.edit") : t("employees.add")}</DialogTitle></DialogHeader>
        <form id="employee-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            {formBranch.show && <BranchSection value={formBranch.branchId} onChange={formBranch.pick} />}
            <FormInput control={form.control} name="firstName" required label={t("employees.name")} />
            <FormInput control={form.control} name="mobile" label={t("users.mobile")} dir="ltr" placeholder="05XXXXXXXX" />
            {canPickBranch && !!employee && <FormSelect control={form.control} name="branchId" numeric label={t("users.branch")} options={branches.map((b) => ({ value: String(b.id), label: b.name ?? "" }))} />}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="employee-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Staff records, as /employees sends them. Service employees are picked on invoices. */
export default function EmployeesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const canSeeBranch = useAuthStore((s) => canManageAllBranches(s.session))
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useEmployeeList({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteEmployee()
  const [editing, setEditing] = useState<Employee | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Employee | null>(null)
  const show = (e: Employee | null) => { setEditing(e); setOpen(true) }

  const columns: Column<Employee>[] = [
    { id: "name", sortKey: "firstName", header: t("employees.name"), cell: (e) => <span className="font-semibold">{e.firstName}</span> },
    { id: "mobile", sortKey: "mobile", header: t("users.mobile"), cell: (e) => <span dir="ltr">{e.mobile || "—"}</span> },
    ...(canSeeBranch ? [{ id: "branch", sortKey: "branchName", header: t("users.branch"), cell: (e: Employee) => e.branchName || "—" }] : []),
    { id: "actions", header: "", align: "end", cell: (e) => (
      // An employee with a sign-in is managed on the users page, which removes both together.
      <RowActions onEdit={can(P.employees.edit) ? () => show(e) : undefined} onDelete={can(P.employees.delete) && !e.userName ? () => setToDelete(e) : undefined} />
    ) },
  ]

  return (
    <>
      <PageHeader title={t("employees.title")} description={t("employees.description")}
        actions={<Can perm={P.employees.add}><Button size="lg" onClick={() => show(null)}><Plus />{t("employees.add")}</Button></Can>} />
      <SectionCard>
        <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(e) => e.id}
          searchText={(e) => `${e.firstName ?? ""} ${e.mobile ?? ""}`} searchPlaceholder={t("employees.search")}
          empty={<EmptyState icon={<IdCard />} title={t("employees.empty")} hint={t("employees.emptyHint")} />} />
      </SectionCard>
      <EmployeeDialog open={open} onOpenChange={setOpen} employee={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("employees.deleteTitle")} description={t("employees.deleteBody", { name: toDelete?.firstName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
