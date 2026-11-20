import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { useAppSettings } from "../queries"
import { usePrinterOptions } from "@/shared/printers/usePrinters"
import { Choice, useLabel, type FieldsProps } from "./fields"

/** The fields of each site-settings tab. Names are the server's. */
const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 gap-8 md:grid-cols-2">{children}</div>

export function TobaccoFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  // No tobacco fee when the branch is tax exempt.
  if (useAppSettings().taxSetting?.taxSetting === "Exempt") return null
  return <Grid><FormInput control={control} name="tobaccoFees.tobaccoFees" type="number" required label={label("tobaccoFees")} /></Grid>
}

export function PrintRoutingFields({ form: { control } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const print = useAppSettings().print
  const invoicePrinters = usePrinterOptions(print?.defultPrinter)
  const bonPrinters = usePrinterOptions(print?.defultPreparedPrinter)
  return (
    <Grid>
      <FormSelect control={control} name="print.defultPrinter" label={label("defultPrinter")} allowEmpty={t("common.none")} options={invoicePrinters} />
      <FormSelect control={control} name="print.defultPreparedPrinter" label={label("defultPreparedPrinter")} allowEmpty={t("common.none")} options={bonPrinters} />
      {window.desktop && (
        <div className="flex flex-col items-start gap-1.5 md:col-span-2">
          <Button type="button" variant="outline" onClick={() => window.desktop?.openPrintLog()}>{t("desktopPrint.openLog")}</Button>
          <p className="text-xs text-muted-foreground">{t("desktopPrint.logHint")}</p>
        </div>
      )}
    </Grid>
  )
}

export function TaxSystemFields({ form: { control } }: FieldsProps) {
  return <Grid><Choice control={control} name="taxSetting.taxSetting" values={["Exempt", "FirstStage", "SecondStage"]} /></Grid>
}

export function WhatsappFields({ form: { control } }: FieldsProps) {
  const label = useLabel()
  return (
    <Grid>
      {["whatsAppBusinessAccountId", "whatsAppPhoneNumberId", "whatsAppAppId", "whatsAppAccessToken", "whatsAppAppSecret", "whatsAppTemplateName"].map((k) => (
        <FormInput key={k} control={control} name={`whatsApp.${k}`} dir="ltr" label={label(k)} type={k.endsWith("Token") || k.endsWith("Secret") ? "password" : "text"} />
      ))}
    </Grid>
  )
}

export function EmailFields({ form: { control } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  return (
    <Grid>
      <FormInput control={control} name="local.smtpHost" dir="ltr" label={label("smtpHost")} />
      <FormInput control={control} name="local.smtpPort" type="number" required label={label("smtpPort")} />
      <FormSelect control={control} name="local.smtpEncryption" label={label("smtpEncryption")} options={["None", "SSL", "TLS"].map((o) => ({ value: o, label: t(`settings.o.smtpEncryption.${o}`) }))} />
      <FormInput control={control} name="local.smtpUser" dir="ltr" label={label("smtpUser")} />
      <FormInput control={control} name="local.smtpPassword" type="password" dir="ltr" label={label("smtpPassword")} />
    </Grid>
  )
}
