import { useRouteError } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

const isChunkError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String((e as Error)?.message ?? e))

export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">{t("common.routeErrorTitle")}</h1>
      <p className="text-muted-foreground">{isChunkError(error) ? t("common.routeErrorChunk") : String((error as Error)?.message ?? "")}</p>
      <Button onClick={() => window.location.reload()}>{t("common.reload")}</Button>
    </div>
  )
}
