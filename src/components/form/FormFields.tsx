import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Thin react-hook-form wrappers over shadcn's Field. Error messages in schemas are i18n keys,
 * translated here so schemas stay language-agnostic.
 */
type Base<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
  className?: string
  /** Keep the label for screen readers only, for repeated rows under a shared header. */
  labelHidden?: boolean
}

function Label({ label, required, hidden }: { label: string; required?: boolean; hidden?: boolean }) {
  return (
    <FieldLabel className={hidden ? "sr-only" : undefined}>
      {label}
      {required && <span className="text-destructive">*</span>}
    </FieldLabel>
  )
}

function useErrorText() {
  const { t } = useTranslation()
  return (msg?: string) => (msg ? [{ message: t(msg) }] : undefined)
}

/**
 * What a cleared number box holds. A row of a field array ("payments.0.amount") would get its first value back when
 * set to `undefined` (the form falls back to the row's default), so there an empty box is `null`; elsewhere `undefined`.
 */
const emptyNumber = (name: string) => (/\.\d+(\.|$)/.test(name) ? null : undefined)

/**
 * A number box that has been 0 shows nothing (its placeholder) while it is 0, and clearing it means 0 again. Boxes that never
 * held 0 (optional ones such as calories) keep their own empty value. The text is kept here so "0." can be typed.
 */
function NumberText({ value, onValue, empty, placeholder, ...rest }: { value: number | null | undefined; onValue: (v: number | null | undefined) => void; empty: null | undefined } & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const zero = useRef(false)
  if (value === 0) zero.current = true
  const show = (v: number | null | undefined) => (v == null || (zero.current && v === 0) ? "" : String(v))
  const [text, setText] = useState(show(value))
  // Follow outside changes (a reset, a computed value) but not our own typing.
  useEffect(() => { if (value !== (text === "" ? (zero.current ? 0 : empty) : Number(text))) setText(show(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Input {...rest} type="number" value={text} placeholder={placeholder ?? (zero.current ? "0" : undefined)}
      onChange={(e) => { setText(e.target.value); onValue(e.target.value === "" ? (zero.current ? 0 : empty) : Number(e.target.value)) }} />
  )
}

export function FormInput<T extends FieldValues>({
  control, name, label, description, required, className, type = "text", dir, placeholder, disabled, end, labelHidden, autoComplete, readOnly,
}: Base<T> & { readOnly?: boolean; type?: "text" | "number" | "password" | "email" | "date"; dir?: "ltr" | "rtl"; placeholder?: string; disabled?: boolean; end?: ReactNode; autoComplete?: string }) {
  const err = useErrorText()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <Label label={label} required={required} hidden={labelHidden} />
          <div className="flex gap-2">
            {type === "number" ? (
              <NumberText
                name={field.name} ref={field.ref} onBlur={field.onBlur}
                value={field.value} onValue={field.onChange} empty={emptyNumber(name)}
                id={name} step="any" inputMode="decimal" dir={dir} autoComplete={autoComplete} placeholder={placeholder}
                disabled={disabled} readOnly={readOnly} aria-invalid={fieldState.invalid} className="h-10"
              />
            ) : (
            <Input
              {...field}
              id={name}
              type={type}
              dir={dir}
              autoComplete={autoComplete}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={fieldState.invalid}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              className="h-10"
            />
            )}
            {end}
          </div>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={err(fieldState.error?.message)} />
        </Field>
      )}
    />
  )
}

export function FormTextarea<T extends FieldValues>({ control, name, label, description, className, placeholder, readOnly }: Base<T> & { placeholder?: string; readOnly?: boolean }) {
  const err = useErrorText()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <Label label={label} />
          <Textarea {...field} id={name} value={field.value ?? ""} placeholder={placeholder} readOnly={readOnly} aria-invalid={fieldState.invalid} />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={err(fieldState.error?.message)} />
        </Field>
      )}
    />
  )
}

export type Option = { value: string; label: string }

/** Select bound to a string or number field; `numeric` converts the chosen value back to a number. */
export function FormSelect<T extends FieldValues>({
  control, name, label, description, required, className, options, placeholder, numeric, disabled, allowEmpty, labelHidden,
}: Base<T> & { options: Option[]; placeholder?: string; numeric?: boolean; disabled?: boolean; allowEmpty?: string }) {
  const err = useErrorText()
  const EMPTY = "__none__"
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <Label label={label} required={required} hidden={labelHidden} />
          <Select
            disabled={disabled}
            value={field.value == null || field.value === "" ? (allowEmpty ? EMPTY : "") : String(field.value)}
            onValueChange={(v) => field.onChange(v === EMPTY ? null : numeric ? Number(v) : v)}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="h-10 w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowEmpty && <SelectItem value={EMPTY}>{allowEmpty}</SelectItem>}
              {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={err(fieldState.error?.message)} />
        </Field>
      )}
    />
  )
}

export function FormSwitch<T extends FieldValues>({ control, name, label, description }: Omit<Base<T>, "required" | "className">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal" className="justify-between">
          <div className="flex flex-col">
            <FieldLabel htmlFor={name} className="font-normal">{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </div>
          <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  )
}
