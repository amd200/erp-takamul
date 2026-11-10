import { useEffect, useState } from "react"
import { bookingStatusOf } from "../types"
import { Controller, useForm } from "react-hook-form"
import { formatDateTime } from "@/lib/format"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { BOOKING_STATUSES } from "../types"
import type { BookingStatus, Reservation } from "../types"
import { useDeleteReservation, useReservations, useSaveReservation, useSetReservationStatus } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import { emptyReservation, reservationSchema, type ReservationForm } from "../schema"

const STATUS_TONE: Record<BookingStatus, string> = { Confirmed: "text-success", Deferred: "text-warning", Cancelled: "text-destructive" }

function ReservationDialog({ open, onOpenChange, reservation }: { open: boolean; onOpenChange: (o: boolean) => void; reservation: Reservation | null }) {
  const { t } = useTranslation()
  const save = useSaveReservation()
  const formBranch = useFormBranch(open && !reservation)
  const form = useForm<ReservationForm>({ resolver: zodResolver(reservationSchema), defaultValues: emptyReservation() })
  useEffect(() => {
    if (!open) return
    form.reset(reservation
      ? { customerName: reservation.customerName ?? "", customerPhone: reservation.customerPhone ?? "", date: (reservation.bookingDateTime ?? reservation.bookingDate ?? "").slice(0, 10), time: (reservation.bookingTime ?? "").slice(0, 5) || "20:00", status: bookingStatusOf(reservation.status), notes: reservation.notes ?? "", customerId: reservation.customerId ?? null }
      : emptyReservation())
  }, [open, reservation, form])
  const submit = form.handleSubmit((data) => save.mutate({ id: reservation?.id, data }, { onSuccess: () => onOpenChange(false) }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{reservation ? t("reservations.edit") : t("reservations.add")}</DialogTitle></DialogHeader>
        <form id="reservation-form" onSubmit={submit} noValidate>
          <FieldGroup className="gap-4">
            {formBranch.show && <BranchSection value={formBranch.branchId} onChange={formBranch.pick} />}
            <FormInput control={form.control} name="customerName" required label={t("reservations.customerName")} />
            <FormInput control={form.control} name="customerPhone" required label={t("users.mobile")} dir="ltr" />
            <div className="grid grid-cols-2 gap-3">
              <Controller control={form.control} name="date" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="r-date">{t("common.date")}</FieldLabel><Input id="r-date" type="date" className="h-10" {...field} />{fieldState.error?.message && <FieldError>{t(fieldState.error.message)}</FieldError>}</Field>
              )} />
              <Controller control={form.control} name="time" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="r-time">{t("reservations.time")}</FieldLabel><Input id="r-time" type="time" className="h-10" dir="ltr" {...field} />{fieldState.error?.message && <FieldError>{t(fieldState.error.message)}</FieldError>}</Field>
              )} />
            </div>
            {reservation && <FormSelect control={form.control} name="status" label={t("common.status")} options={BOOKING_STATUSES.map((s) => ({ value: s, label: t(`reservations.statuses.${s}`) }))} />}
            <FormTextarea control={form.control} name="notes" label={t("common.notes")} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="reservation-form" disabled={save.isPending}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Table bookings: filter by status, day and text; change a status in place; add, edit and delete. */
export default function ReservationsPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const canManage = can(P.reservations.view)
  const [status, setStatus] = useState<"all" | BookingStatus>("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useReservations({ status: status === "all" ? undefined : status, dateFrom: from, dateTo: to, sortBy, sortDescending })
  const setBookingStatus = useSetReservationStatus()
  const del = useDeleteReservation()
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Reservation | null>(null)

  const columns: Column<Reservation>[] = [
    { id: "number", sortKey: "bookingNumber", header: t("reservations.number"), cell: (r) => <span className="font-semibold">{r.bookingNumber}</span> },
    { id: "customer", sortKey: "customerName", header: t("reservations.customerName"), cell: (r) => <span className="font-medium">{r.customerName}</span> },
    { id: "phone", sortKey: "customerPhone", header: t("users.mobile"), cell: (r) => <span dir="ltr" className="text-muted-foreground">{r.customerPhone}</span> },
    { id: "when", sortKey: "bookingDate", header: t("reservations.when"), cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.bookingDateTime ?? r.bookingDate ?? "", i18n.language, (r.bookingTime ?? "").slice(0, 5))}</span> },
    { id: "branch", sortKey: "branchName", header: t("shifts.branch"), cell: (r) => <span className="text-muted-foreground">{r.branchName || "—"}</span> },
    { id: "status", sortKey: "status", header: t("common.status"), cell: (r) => (
      <Select value={bookingStatusOf(r.status)} disabled={!canManage || setBookingStatus.isPending} onValueChange={(v) => setBookingStatus.mutate({ id: r.id, status: v as BookingStatus })}>
        <SelectTrigger className={`h-8 w-28 text-xs font-medium ${STATUS_TONE[bookingStatusOf(r.status)]}`} aria-label={t("common.status")}><SelectValue /></SelectTrigger>
        <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`reservations.statuses.${s}`)}</SelectItem>)}</SelectContent>
      </Select>
    ) },
    { id: "notes", sortKey: "notes", header: t("common.notes"), cell: (r) => <span className="line-clamp-1 max-w-48 text-muted-foreground">{r.notes || "—"}</span> },
    { id: "actions", header: "", align: "end", cell: (r) => canManage && <RowActions onEdit={() => { setEditing(r); setOpen(true) }} onDelete={() => setToDelete(r)} /> },
  ]

  return (
    <>
      <PageHeader title={t("reservations.title")} description={t("reservations.description")}
        actions={canManage && <Button size="lg" onClick={() => { setEditing(null); setOpen(true) }}><Plus />{t("reservations.add")}</Button>} />
      <SectionCard>
        <DataTable rows={data ?? []} loading={isLoading} columns={columns} sort={sort} rowKey={(r) => r.id}
          searchText={(r) => `${r.bookingNumber} ${r.customerName} ${r.customerPhone} ${r.notes}`} searchPlaceholder={t("reservations.search")}
          filters={
            <>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="h-10 w-40" aria-label={t("common.status")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reservations.allStatuses")}</SelectItem>
                  {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`reservations.statuses.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t("sales.from")} className="h-10 w-36" />
                {t("sales.to")}
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("sales.to")} className="h-10 w-36" />
              </div>
            </>
          }
          empty={<EmptyState icon={<CalendarDays />} title={t("reservations.empty")} hint={t("reservations.emptyHint")} />} />
      </SectionCard>
      <ReservationDialog open={open} onOpenChange={setOpen} reservation={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("reservations.deleteTitle")} description={t("reservations.deleteBody", { name: toDelete?.customerName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
