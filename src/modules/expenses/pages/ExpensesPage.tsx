import { useEffect, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Wallet } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { formatMoney, formatDateTime } from "@/lib/format"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useTreasuryList } from "@/modules/treasuries/queries"
import { emptyExpense, expenseSchema, type ExpenseForm } from "../schema"
import { useDeleteExpense, useExpenseItems, useExpenses, useSaveExpense } from "../queries"
import type { Expense } from "../types"

function ExpenseDialog({ open, onOpenChange, expense }: { open: boolean; onOpenChange: (o: boolean) => void; expense: Expense | null }) {
  const { t } = useTranslation()
  const { data: treasuries = [] } = useTreasuryList()
  const { data: items = [] } = useExpenseItems()
  const save = useSaveExpense()
  const key = useRef(newIdempotencyKey())
  const form = useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema), defaultValues: emptyExpense() })
  const [treasuryId, amount] = useWatch({ control: form.control, name: ["treasuryId", "amount"] })

  useEffect(() => {
    if (!open) return
    key.current = newIdempotencyKey()
    form.reset(expense
      ? { name: expense.name ?? "", amount: expense.amount ?? 0, date: (expense.date ?? "").slice(0, 10), treasuryId: expense.treasuryId ?? 0, itemId: expense.itemId ?? null, notes: expense.notes ?? "" }
      : emptyExpense())
  }, [open, expense, form])

  // Only a new expense is checked against the balance: an edited one is already counted in it.
  const treasury = treasuries.find((x) => x.id === treasuryId)
  const over = !expense && treasury?.currentBalance != null && (amount || 0) > treasury.currentBalance
  const treasuryOptions = treasuries.map((x) => ({ value: String(x.id), label: `${x.name} — ${x.currentBalance == null ? "—" : formatMoney(x.currentBalance)}` }))
  // Stopped items stay selectable on the expense that already uses one.
  const itemOptions = items.filter((x) => x.isActive !== false || x.id === expense?.itemId).map((x) => ({ value: String(x.id), label: x.name ?? "" }))
  const submit = form.handleSubmit((data) => !over && save.mutate({ id: expense?.id, data, key: key.current }, { onSuccess: () => onOpenChange(false), onError: renewIfReused(key) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{expense ? t("expenses.edit") : t("expenses.add")}</DialogTitle></DialogHeader>
        <form id="expense-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            <FormInput control={form.control} name="name" label={t("expenses.name")} placeholder={t("expenses.namePlaceholder")} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput control={form.control} name="amount" type="number" required label={t("expenses.amount")} />
              <Controller control={form.control} name="date" render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="expense-date">{t("common.date")}</FieldLabel>
                  <Input id="expense-date" type="date" className="h-10" {...field} />
                </Field>
              )} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormSelect control={form.control} name="treasuryId" numeric required label={t("expenses.treasury")} options={treasuryOptions} placeholder={t("expenses.pickTreasury")} />
              <FormSelect control={form.control} name="itemId" numeric label={t("expenses.item")} options={itemOptions} allowEmpty={t("expenses.noItem")} />
            </div>
            {over && <p className="text-sm text-destructive">{t("treasuries.errors.insufficient")}</p>}
            <FormTextarea control={form.control} name="notes" label={t("common.notes")} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="expense-form" disabled={save.isPending || over}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpensesPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useExpenses({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteExpense()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Expense | null>(null)
  const open = (x: Expense | null) => { setEditing(x); setDialogOpen(true) }

  // The same seven columns, in the same order, as the current system.
  const columns: Column<Expense>[] = [
    { id: "date", sortKey: "date", header: t("expenses.colDate"), cell: (x) => (x.date ? formatDateTime(x.date + "T12:00:00", i18n.language) : "—") },
    { id: "name", sortKey: "name", header: t("expenses.colName"), cell: (x) => <span className="font-semibold">{x.name}</span> },
    { id: "treasury", sortKey: "treasuryName", header: t("expenses.treasury"), cell: (x) => x.treasuryName || "—" },
    { id: "item", sortKey: "itemName", header: t("expenses.item"), cell: (x) => x.itemName || "—" },
    { id: "amount", sortKey: "amount", header: t("expenses.amount"), cell: (x) => <span className="tabular-nums">{formatMoney(x.amount ?? 0)}</span> },
    { id: "notes", sortKey: "notes", header: t("expenses.colNotes"), cell: (x) => x.notes || "—" },
    { id: "actions", header: t("expenses.colActions"), cell: (x) => (can(P.expenses.edit) || can(P.expenses.delete)) && (
      <RowActions onEdit={can(P.expenses.edit) ? () => open(x) : undefined} onDelete={can(P.expenses.delete) ? () => setToDelete(x) : undefined} />
    ) },
  ]

  return (
    <>
      <PageHeader title={t("expenses.title")} description={t("expenses.subtitle")}
        actions={<Can perm={P.expenses.add}><Button size="lg" onClick={() => open(null)}><Plus />{t("expenses.add")}</Button></Can>} />
      <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(x) => x.id} empty={<EmptyState icon={<Wallet />} title={t("expenses.empty")} hint={t("expenses.emptyHint")} />} />
      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("expenses.deleteTitle")} description={t("expenses.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
