import { useState } from "react"
import { enteredPrice } from "@/modules/products/mappers"
import { Minus, Plus, Printer, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useCurrency } from "@/modules/settings"
import { BarcodeLabel } from "../components/BarcodeLabel"

const SIZES = ["50x30", "40x20", "a4"] as const
type Line = { productId: number; copies: number }

export default function BarcodePrintPage() {
  const { t } = useTranslation()
  const currency = useCurrency()
  const [lines, setLines] = useState<Line[]>([])
  // The items picked so far; they come from the server search, so only these are ever loaded.
  const [picked, setPicked] = useState<Map<number, Product>>(new Map())
  const [size, setSize] = useState<(typeof SIZES)[number]>("50x30")

  const printable = (p: Product) => !!p.barcode && !lines.some((l) => l.productId === p.id)
  const add = (p: Product) => {
    setPicked((all) => new Map(all).set(p.id, p))
    setLines((all) => [...all, { productId: p.id, copies: 1 }])
  }
  const total = lines.reduce((s, l) => s + l.copies, 0)
  const first = picked.get(lines[0]?.productId)
  const setCopies = (id: number, copies: number) => setLines(lines.map((l) => (l.productId === id ? { ...l, copies: Math.max(1, copies) } : l)))

  return (
    <>
      <PageHeader title={t("barcode.title")} description={t("barcode.description")}
        actions={<Button size="lg" disabled={!lines.length}><Printer />{t("barcode.print", { count: total })}</Button>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard title={t("barcode.items")} description={t("barcode.itemsHint")}>
          <div className="mb-4 flex flex-wrap gap-2">
            <ProductSearchPicker accept={printable} onPick={add}>
              <Button variant="outline" size="lg"><Plus />{t("barcode.pickItem")}</Button>
            </ProductSearchPicker>
          </div>
          {lines.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("barcode.noItems")}</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {lines.map((l) => {
                const p = picked.get(l.productId)
                if (!p) return null
                return (
                  <li key={l.productId} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.productNameAr}</div>
                      <div className="text-xs text-faint" dir="ltr">{p.barcode}</div>
                    </div>
                    <div className="flex items-center rounded-lg border" role="group" aria-label={t("barcode.copies")}>
                      <Button variant="ghost" size="icon" aria-label={t("barcode.fewer")} onClick={() => setCopies(l.productId, l.copies - 1)}><Minus /></Button>
                      <span className="w-9 text-center tabular-nums">{l.copies}</span>
                      <Button variant="ghost" size="icon" aria-label={t("barcode.more")} onClick={() => setCopies(l.productId, l.copies + 1)}><Plus /></Button>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={t("common.remove")} onClick={() => setLines(lines.filter((x) => x.productId !== l.productId))}
                      className="hover:bg-destructive-soft hover:text-destructive"><X /></Button>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
        <div className="flex flex-col gap-5">
          <SectionCard title={t("barcode.size")}>
            <Field>
              <FieldLabel htmlFor="label-size">{t("barcode.size")}</FieldLabel>
              <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                <SelectTrigger id="label-size" className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{t(`barcode.sizes.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </SectionCard>
          <SectionCard title={t("barcode.preview")} description={t("barcode.previewHint")}>
            {first ? <BarcodeLabel name={first.productNameAr} barcode={first.barcode ?? ""} price={enteredPrice(first)} currency={currency} />
              : <p className="py-6 text-center text-xs text-muted-foreground">{t("barcode.previewEmpty")}</p>}
          </SectionCard>
        </div>
      </div>
    </>
  )
}
