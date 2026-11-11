import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranches } from "@/modules/lookups/service"

/** Which branch a new record is created on, the first field of its form: shown to multi-branch users only (the server pins everyone else to their own). */
export function BranchSection({ value, onChange, hint, className = "", plain = false }: { value: number | null; onChange: (branchId: number) => void; hint?: ReactNode; className?: string; plain?: boolean }) {
  const { t } = useTranslation()
  const { data: branches = [] } = useBranches()
  return (
    <Field className={plain ? className : `rounded-sm border border-primary/30 bg-primary/5 p-3 ${className}`}>
      <FieldLabel>{t("branches.formLabel")}<span className="text-destructive">*</span></FieldLabel>
      <Select value={value ? String(value) : ""} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder={t("topbar.selectBranch")} />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {!plain && <FieldDescription>{hint ?? t("branches.formHint")}</FieldDescription>}
    </Field>
  )
}
