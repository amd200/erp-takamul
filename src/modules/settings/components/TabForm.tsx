import { useEffect, useMemo } from "react"
import { useBlocker, useNavigate } from "react-router-dom"
import { useForm, type FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { readLocal } from "../local"
import { useAppSettings, useSaveTab } from "../queries"
import { valuesOf } from "../service"
import type { FormTab } from "../tabs"

/**
 * One settings tab as a form, in the current system's look: the sales settings are a grid with a cancel / save footer,
 * the site settings a titled box with its own save button. Leaving with unsaved changes asks first.
 */
export function TabForm({ tab, readOnly }: { tab: FormTab; readOnly: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useAppSettings()
  const save = useSaveTab()
  const saved = useMemo(() => valuesOf(tab.empty, settings, readLocal()), [tab, settings])
  const form = useForm<FieldValues>({ resolver: zodResolver(tab.schema) as never, defaultValues: saved })
  useEffect(() => { form.reset(saved) }, [saved, form])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => form.formState.isDirty && currentLocation.pathname !== nextLocation.pathname)
  const submit = form.handleSubmit((data) => save.mutate({ data, saved }))

  const fields = <fieldset disabled={readOnly} className="contents"><tab.Fields form={form} /></fieldset>
  const leave = (
    <ConfirmDialog open={blocker.state === "blocked"} onOpenChange={(o) => !o && blocker.reset?.()}
      title={t("settings.leaveTitle")} description={t("settings.leaveBody")} confirmLabel={t("settings.leave")}
      onConfirm={() => blocker.proceed?.()} />
  )

  if (tab.page === "system") {
    const Icon = tab.icon
    return (
      <form onSubmit={submit} noValidate>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></span>
            <h2 className="text-lg font-bold text-foreground">{t(`settings.s.${tab.id}`)}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {fields}
            {readOnly && <p className="mt-4 text-sm text-muted-foreground">{t("settings.readOnly")}</p>}
          </div>
        </section>
        {!readOnly && form.formState.isDirty && (
          <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground"><span className="size-2 rounded-full bg-amber-500" />{t("settings.unsaved")}</span>
            <div className="flex gap-2 max-sm:[&>button]:flex-1">
              <Button type="button" variant="outline" onClick={() => form.reset(saved)}>{t("settings.discard")}</Button>
              <Button type="submit" className="gap-2 px-6 font-bold" disabled={save.isPending}><Save size={18} />{t("settings.saveSettings")}</Button>
            </div>
          </div>
        )}
        {leave}
      </form>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      {fields}
      {readOnly && <p className="mt-4 text-sm text-muted-foreground">{t("settings.readOnly")}</p>}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 rounded border border-border px-3 py-4 sm:flex-row">
        <Button type="button" size="lg" variant="destructive" className="h-12 w-full px-8 sm:w-auto" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
        {!readOnly && <Button type="submit" size="lg" className="h-12 w-full px-8 text-base sm:w-auto" disabled={save.isPending}>{t("settings.saveSettings")}</Button>}
      </div>
      {leave}
    </form>
  )
}
