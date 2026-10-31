import { Hammer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"

export function NotBuiltPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t("soon.title")} />
      <Card><EmptyState icon={<Hammer />} title={t("soon.heading")} hint={t("soon.hint")} /></Card>
    </>
  )
}
