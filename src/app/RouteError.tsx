import { useEffect, useState } from "react"
import { useRouteError } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { isChunkError, reloadOnce } from "@/shared/monitoring/chunkReload"
import { reportError } from "@/shared/monitoring/sentry"

export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const chunk = isChunkError(error)
  const [reloading, setReloading] = useState(chunk)
  // A new deploy's missing chunk is not a bug: reload silently (once); everything else is reported.
  useEffect(() => {
    if (!chunk) reportError(error)
    else setReloading(reloadOnce())
  }, [error, chunk])
  if (reloading) return null
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">{t("common.routeErrorTitle")}</h1>
      <p className="text-muted-foreground">{chunk ? t("common.routeErrorChunk") : String((error as Error)?.message ?? "")}</p>
      <Button onClick={() => window.location.reload()}>{t("common.reload")}</Button>
    </div>
  )
}
