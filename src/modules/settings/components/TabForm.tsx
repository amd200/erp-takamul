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
    return (
      <form onSubmit={submit} noValidate>
        <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-[var(--bg-main)]/50 p-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-main)]"><div className="h-6 w-1 rounded-full bg-primary" />{t(`settings.s.${tab.id}`)}</h2>
          </div>
          <div className="p-6">
            {fields}
            {readOnly && <p className="mt-4 text-sm text-muted-foreground">{t("settings.readOnly")}</p>}
            {!readOnly && (
              <div className="mt-8 flex justify-start border-t border-border pt-6">
                <Button type="submit" className="flex items-center gap-2 px-6 font-bold" disabled={save.isPending}><Save size={18} />{t("settings.saveSettings")}</Button>
              </div>
            )}
          </div>
        </section>
        {leave}
      </form>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      {fields}
      {readOnly && <p className="mt-4 text-sm text-muted-foreground">{t("settings.readOnly")}</p>}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 rounded border border-gray-100 px-3 py-4 sm:flex-row">
        <Button type="button" size="lg" variant="destructive" className="h-12 w-full px-8 sm:w-auto" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
        {!readOnly && <Button type="submit" size="lg" className="h-12 w-full px-8 text-base sm:w-auto" disabled={save.isPending}>{t("settings.saveSettings")}</Button>}
      </div>
      {leave}
    </form>
  )
}
