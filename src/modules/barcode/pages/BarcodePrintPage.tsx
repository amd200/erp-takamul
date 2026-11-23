import { useState } from "react"
import { Barcode, Minus, Plus, Printer, RotateCcw, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import i18n from "@/shared/i18n"
import { useAuthStore } from "@/shared/auth/authStore"
import { printDocument } from "@/shared/print"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { useBranches } from "@/modules/lookups/service"
import { useCurrency } from "@/modules/settings"
import { BarcodeLabel } from "../components/BarcodeLabel"
import { labelHtml, labelsDocument, type LabelData } from "../label"
import { useLabelSettings, type LabelSettings, type TextStyle } from "../settings"

/** `company` is the activity name typed for this item; until then the branch name is used. */
type Line = { product: Product; copies: number; company?: string }

/** A number field that can be emptied while typing; the label applies its own minimum. */
function NumberField({ id, label, unit, value, onChange }: { id: string; label: string; unit?: string; value: number; onChange: (n: number) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input id={id} type="number" min={0} value={value || ""} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className="h-10 pe-12" />
        {unit && <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">{unit}</span>}
      </div>
    </Field>
  )
}

function StyleRow({ id, title, style, onChange }: { id: string; title: string; style: TextStyle; onChange: (s: TextStyle) => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-sm border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="size-1.5 rounded-full bg-primary" />{title}</div>
      <div className="grid grid-cols-2 gap-4">
        <NumberField id={`${id}-size`} label={t("barcode.fontSize")} unit="px" value={style.fontSize} onChange={(fontSize) => onChange({ ...style, fontSize: Math.min(72, fontSize) })} />
        <NumberField id={`${id}-spacing`} label={t("barcode.spacing")} unit="px" value={style.spacing} onChange={(spacing) => onChange({ ...style, spacing: Math.min(50, spacing) })} />
      </div>
    </div>
  )
}

export default function BarcodePrintPage() {
  const { t } = useTranslation()
  const currency = useCurrency()
  const { settings, change, reset } = useLabelSettings()
  const [lines, setLines] = useState<Line[]>([])
  const branchId = useAuthStore((s) => s.session?.branchId)
  const branchName = useBranches().data?.find((b) => b.id === branchId)?.name ?? ""

  const dataOf = (l: Line): LabelData => ({
    company: l.company ?? branchName,
    name: l.product.productNameAr || l.product.productNameEn || "",
    price: l.product.sellingPrice || 0,
    currency, priceLabel: t("barcode.price"),
    barcode: l.product.barcode || String(l.product.productCode ?? ""),
  })

  // Adding an item that is already in the list adds one more copy, as in the current system.
  const add = (p: Product) => setLines((all) => all.some((l) => l.product.id === p.id)
    ? all.map((l) => (l.product.id === p.id ? { ...l, copies: l.copies + 1 } : l))
    : [...all, { product: p, copies: 1 }])
  const patch = (id: number, p: Partial<Line>) => setLines((all) => all.map((l) => (l.product.id === id ? { ...l, ...p } : l)))
  const total = lines.reduce((s, l) => s + l.copies, 0)
  // The label always has some size, even while a field is being retyped.
  const size: LabelSettings = { ...settings, width: Math.max(10, settings.width), height: Math.max(10, settings.height), barcodeHeight: Math.max(5, settings.barcodeHeight), numberSize: Math.max(4, settings.numberSize) }

  const sample: LabelData = { company: branchName, name: t("barcode.sample"), price: 99, currency, priceLabel: t("barcode.price"), barcode: "123456789012" }
  const preview = lines[0] ? dataOf(lines[0]) : sample

  const print = () => {
    const labels = lines.flatMap((l) => Array.from({ length: l.copies }, () => labelHtml(dataOf(l), size))).join("")
    void printDocument({ title: t("barcode.title"), paper: "a4", body: "", html: labelsDocument(labels, size, t("barcode.title"), i18n.dir()) })
  }

  const toggles = [
    { key: "showCompany", label: t("barcode.company") },
    { key: "showName", label: t("barcode.itemName") },
    { key: "showPrice", label: t("barcode.sellingPrice") },
    { key: "showCurrency", label: t("barcode.currency") },
  ] as const

  return (
    <>
      <PageHeader title={t("barcode.title")} description={t("barcode.description")}
        actions={<Button size="lg" disabled={!lines.length} onClick={print}><Printer />{t("barcode.print", { count: total })}</Button>} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title={t("barcode.items")} action={
            <ProductSearchPicker accept={() => true} onPick={add} align="end">
              <Button variant="outline" size="lg"><Plus />{t("barcode.pickItem")}</Button>
            </ProductSearchPicker>}>
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Barcode className="size-10 opacity-40" />
                <p className="font-bold">{t("barcode.noItems")}</p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {lines.map((l) => (
                  <li key={l.product.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_200px_auto_auto]">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{l.product.productNameAr}</div>
                      <div className="text-xs text-faint" dir="ltr">{l.product.barcode || l.product.productCode}</div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={t("common.remove")} onClick={() => setLines(lines.filter((x) => x !== l))}
                      className="hover:bg-destructive-soft hover:text-destructive md:order-last"><X /></Button>
                    <Input aria-label={t("barcode.activityName")} placeholder={t("barcode.activityName")} value={l.company ?? branchName} onChange={(e) => patch(l.product.id, { company: e.target.value })} className="col-span-2 h-9 md:col-span-1" />
                    <div className="col-span-2 flex items-center justify-self-start rounded-lg border md:col-span-1" role="group" aria-label={t("barcode.copies")}>
                      <Button variant="ghost" size="icon" aria-label={t("barcode.fewer")} onClick={() => patch(l.product.id, { copies: Math.max(1, l.copies - 1) })}><Minus /></Button>
                      <input type="number" min={1} aria-label={t("barcode.copies")} value={l.copies} onChange={(e) => patch(l.product.id, { copies: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-12 bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                      <Button variant="ghost" size="icon" aria-label={t("barcode.more")} onClick={() => patch(l.product.id, { copies: l.copies + 1 })}><Plus /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={t("barcode.labelSettings")}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <NumberField id="label-width" label={t("barcode.width")} unit={t("barcode.mm")} value={settings.width} onChange={(width) => change({ width })} />
              <NumberField id="label-height" label={t("barcode.height")} unit={t("barcode.mm")} value={settings.height} onChange={(height) => change({ height })} />
              <NumberField id="bars-height" label={t("barcode.barsHeight")} unit="px" value={settings.barcodeHeight} onChange={(barcodeHeight) => change({ barcodeHeight })} />
              <NumberField id="number-size" label={t("barcode.numberSize")} unit="px" value={settings.numberSize} onChange={(numberSize) => change({ numberSize })} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-sm border border-border p-4">
              <span className="flex items-center gap-2 text-sm font-bold"><Barcode className="size-4 text-primary" />{t("barcode.printOptions")}</span>
              {toggles.map(({ key, label }) => {
                const off = key === "showCurrency" && !settings.showPrice
                return (
                  <label key={key} className={`flex items-center gap-2 text-sm font-semibold ${off ? "opacity-50" : ""}`}>
                    <Checkbox checked={settings[key]} disabled={off} onCheckedChange={(c) => change({ [key]: !!c })} />
                    {label}
                  </label>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title={t("barcode.fonts")} description={t("barcode.fontsHint")}>
            <div className="grid gap-4 lg:grid-cols-3">
              <StyleRow id="company" title={t("barcode.companyStyle")} style={settings.company} onChange={(company) => change({ company })} />
              <StyleRow id="name" title={t("barcode.nameStyle")} style={settings.name} onChange={(name) => change({ name })} />
              <StyleRow id="price" title={t("barcode.priceStyle")} style={settings.price} onChange={(price) => change({ price })} />
            </div>
          </SectionCard>
        </div>

        <div className="xl:sticky xl:top-20">
          <SectionCard title={t("barcode.preview")} description={t("barcode.previewHint")}>
            <div className="flex min-h-56 items-center justify-center rounded-sm bg-muted/60 p-5">
              <BarcodeLabel data={preview} settings={size} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{size.width} × {size.height} {t("barcode.mm")}{!lines.length && ` · ${t("barcode.sampleNote")}`}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="lg" onClick={reset}><RotateCcw />{t("barcode.reset")}</Button>
              <Button size="lg" disabled={!lines.length} onClick={print}><Printer />{t("barcode.print", { count: total })}</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
