import { useEffect, useRef } from "react"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HandCoins, Loader2, Truck, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { EmbeddedDialog } from "@/components/EmbeddedDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormSelect } from "@/components/form/FormFields"
import { useCustomerList } from "@/modules/customers/queries"
import { useSupplierList } from "@/modules/suppliers/queries"
import { useTreasuryList } from "@/modules/treasuries/queries"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import type { VoucherKind } from "../types"
import { useCreateVoucher } from "../queries"
import { voucherSchema, type VoucherForm } from "../schema"

const today = () => new Date().toISOString().slice(0, 10)
const num = (v: number) => Number(v ?? 0).toLocaleString("en-US")

/**
 * New receipt or payment, laid out as in the current system: date and treasury, the account type, then the
 * account with its balance and the amount, the balance after, and the statement.
 */
export function VoucherDialog({ kind, open, onOpenChange, embedded = false, customerId }: { kind: VoucherKind; open: boolean; onOpenChange: (o: boolean) => void
  /** Shown inside the optics customer-tools window instead of as its own popup. */
  embedded?: boolean
  /** The optics receipt tab: a customer receipt only, fixed on the sale's customer when one is chosen. */
  customerId?: number | null }) {
  const { t } = useTranslation()
  // The optics tools take the voucher on the branch they work on; elsewhere a multi-branch user picks it.
  const formBranch = useFormBranch(open && !embedded)
  const { data: customers = [] } = useCustomerList()
  const { data: suppliers = [] } = useSupplierList()
  const { data: treasuries = [] } = useTreasuryList()
  const create = useCreateVoucher()
  // One key per voucher being typed: a double click or a retry saves it once.
  const key = useRef(newIdempotencyKey())
  // Receipts usually come from customers, payments usually go to suppliers.
  const defaults = (): VoucherForm => ({ partyType: kind === "receipt" ? "customer" : "supplier", partyId: customerId ?? 0, treasuryId: treasuries[0]?.id ?? 0, date: today(), amount: 0, description: "" })
  const form = useForm<VoucherForm>({ resolver: zodResolver(voucherSchema), defaultValues: defaults() })
  const [partyType, partyId, treasuryId, amount] = useWatch({ control: form.control, name: ["partyType", "partyId", "treasuryId", "amount"] })

  useEffect(() => { if (open) { form.reset(defaults()); key.current = newIdempotencyKey() } }, [open, treasuries.length, customerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const parties = (partyType === "customer"
    ? customers.filter((p) => p.isActive !== false).map((p) => ({ id: p.id, name: p.customerName, balance: p.balance ?? 0 }))
    : suppliers.filter((p) => p.isActive !== false).map((p) => ({ id: p.id, name: p.supplierName, balance: p.balance ?? 0 })))
  const party = parties.find((p) => p.id === partyId)
  const treasury = treasuries.find((x) => x.id === treasuryId)
  const balance = party?.balance ?? 0
  // A receipt lowers what a customer owes and raises a supplier's balance; a payment is the other way round.
  const lowers = (kind === "receipt") === (partyType === "customer")
  const balanceAfter = lowers ? balance - (amount || 0) : balance + (amount || 0)
  const overdraw = kind === "payment" && treasury?.currentBalance != null && (amount || 0) > treasury.currentBalance

  const submit = form.handleSubmit((v) => !overdraw && create.mutate({ ...v, kind, key: key.current }, { onSuccess: () => { key.current = newIdempotencyKey(); if (embedded) form.reset(defaults()); else onOpenChange(false) }, onError: renewIfReused(key) }))
  const Icon = kind === "receipt" ? HandCoins : Truck
  const order = kind === "receipt" ? (["customer", "supplier"] as const) : (["supplier", "customer"] as const)

  const body = (
    <>
        <DialogHeader className="border-b border-border px-5 py-2">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold text-primary"><Icon size={18} />{t(`vouchers.new.${kind}`)}</DialogTitle>
        </DialogHeader>

        <form id="voucher-form" onSubmit={submit} noValidate className={cn("space-y-3 overflow-x-hidden overflow-y-auto px-5 py-4", embedded ? "min-h-0 flex-1" : "max-h-[60vh]")}>
          {/* The treasuries and accounts reload with the branch and the form starts over (its effect runs when the treasuries change). */}
          {formBranch.show && <BranchSection value={formBranch.branchId} onChange={formBranch.pick} />}
          <div className="grid min-h-[76px] grid-cols-2 items-start gap-3">
            <Controller control={form.control} name="date" render={({ field }) => (
              <Field><FieldLabel htmlFor="v-date">{t("common.date")}</FieldLabel><Input id="v-date" type="date" className="h-9" {...field} /></Field>
            )} />
            <FormSelect control={form.control} name="treasuryId" numeric label={t("sales.treasury")} placeholder={t("vouchers.selectTreasury")}
              options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
          </div>

          {customerId === undefined && <div className="space-y-2 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><h3 className="text-sm font-semibold text-foreground">{t("vouchers.accountType")}</h3></div>
            <div role="radiogroup" className="mt-1 flex gap-6 px-1">
              {order.map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 select-none">
                  <input type="radio" name="partyType" className="peer sr-only" checked={partyType === p}
                    onChange={() => { form.setValue("partyType", p); form.setValue("partyId", 0) }} />
                  {/* The round mark of the current system: a thin ring, and a brand-coloured dot when chosen. */}
                  <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-full border border-input bg-background transition-colors peer-checked:border-primary peer-checked:[&>i]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40">
                    <i className="size-2 rounded-full bg-primary opacity-0 transition-opacity" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{t(`vouchers.party.${p}`)}</span>
                </label>
              ))}
            </div>
          </div>}

          <div className="grid min-h-[76px] grid-cols-[2fr_1fr_1fr] items-start gap-3">
            <FormSelect control={form.control} name="partyId" numeric disabled={!!customerId} label={t(partyType === "customer" ? "vouchers.customerName" : "vouchers.supplierName")} placeholder={t(partyType === "customer" ? "vouchers.selectCustomer" : "vouchers.selectSupplier")}
              options={parties.map((p) => ({ value: String(p.id), label: p.name }))} />
            <Field><FieldLabel>{t("vouchers.currentBalance")}</FieldLabel><Input readOnly value={num(balance)} className="h-9 bg-gray-50 text-center" /></Field>
            <Controller control={form.control} name="amount" render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("sales.amount")}</FieldLabel>
                <Input type="number" step="any" min="0" placeholder="0" className="h-9" value={field.value || ""}
                  onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault() }}
                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
              </Field>
            )} />
          </div>

          <Field><FieldLabel>{t("vouchers.balanceAfter")}</FieldLabel><Input readOnly value={num(balanceAfter)} className="h-9 bg-gray-50 text-center font-semibold text-primary" /></Field>
          {overdraw && <p className="text-sm text-destructive">{t("vouchers.overdraw", { amount: num(treasury!.currentBalance!) })}</p>}

          <Controller control={form.control} name="description" render={({ field }) => (
            <Field><FieldLabel>{t("vouchers.statement")}</FieldLabel><Input className="h-9" placeholder={t(`vouchers.statementHint.${kind}`)} {...field} /></Field>
          )} />
        </form>

        <DialogFooter className="mx-0 mb-0 rounded-none">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="voucher-form" disabled={create.isPending || overdraw}>
            {create.isPending && <Loader2 size={16} className="animate-spin" />}{t(`vouchers.saveVoucher.${kind}`)}
          </Button>
        </DialogFooter>
    </>
  )
  if (embedded) return <EmbeddedDialog>{body}</EmbeddedDialog>
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full overflow-hidden rounded-2xl p-0 sm:max-w-[720px]">{body}</DialogContent>
    </Dialog>
  )
}
