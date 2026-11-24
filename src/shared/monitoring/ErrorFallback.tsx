import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

/** Shown instead of a blank page when the app itself crashes (outside the router). */
export function ErrorFallback() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">{t("common.routeErrorTitle")}</h1>
      <Button onClick={() => window.location.reload()}>{t("common.reload")}</Button>
    </div>
  )
}
