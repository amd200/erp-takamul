import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatNumber } from "@/lib/format"
import { errorToast } from "@/shared/api/errors"
import { ApiError } from "@/shared/http/ApiError"
import { productsApi } from "../service"
import type { ImportResultDto } from "../dto"
import { productKeys } from "../keys"

const MAX_FILE = 5 * 1024 * 1024

/** Download the template, upload a filled sheet, then see what was added, updated and rejected (row by row). */
export default function ImportProductsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResultDto | null>(null)

  const template = useMutation({
    mutationFn: productsApi.template,
    onSuccess: (blob) => {
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "قالب_استيراد_الاصناف.xlsx"
      a.click()
      URL.revokeObjectURL(a.href)
    },
    onError: (e) => errorToast(e, "import.templateFailed"),
  })

  const run = useMutation({
    mutationFn: (f: File) => productsApi.importExcel(f),
    onSuccess: (r) => { setResult(r.data); qc.invalidateQueries({ queryKey: productKeys.all }) },
    // 422 means every row failed; the body still carries the per-row reasons.
    onError: (e) => {
      const data = e instanceof ApiError ? ((e.cause as { response?: { data?: { data?: ImportResultDto } } })?.response?.data?.data) : undefined
      if (data) setResult(data)
      else errorToast(e, "import.failed")
    },
  })

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!/\.xlsx?$/i.test(f.name)) return setFileError(t("import.wrongType"))
    if (f.size > MAX_FILE) return setFileError(t("import.tooBig"))
    setFileError(null); setResult(null); setFile(f)
  }

  return (
    <>
      <PageHeader title={t("import.productsTitle")} description={t("import.productsDescription")} />
      <SectionCard title={t("import.step1")} description={t("import.step1Hint")}
        action={<Button variant="outline" disabled={template.isPending} onClick={() => template.mutate()}>{template.isPending ? <Loader2 className="animate-spin" /> : <Download />}{t("import.template")}</Button>}>
        <input ref={input} type="file" accept=".xlsx,.xls" className="sr-only" aria-label={t("import.drop")} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
          className="grid w-full place-items-center rounded-xl border border-dashed px-6 py-10 text-muted-foreground hover:border-primary hover:bg-secondary/40">
          <span className="flex flex-col items-center gap-1.5">
            {file ? <FileSpreadsheet className="size-8 text-primary" /> : <UploadCloud className="size-8 text-faint" />}
            <span className="font-medium text-foreground">{file?.name ?? t("import.drop")}</span>
            <span className="text-xs text-faint">{t("import.limits")}</span>
          </span>
        </button>
        {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          {file && <Button variant="outline" size="lg" onClick={() => { setFile(null); setResult(null) }}>{t("common.cancel")}</Button>}
          <Button size="lg" disabled={!file || run.isPending} onClick={() => file && run.mutate(file)}>
            {run.isPending && <Loader2 className="animate-spin" />}{t("import.submitAll")}
          </Button>
        </div>
      </SectionCard>

      {result && (
        <SectionCard title={t("import.resultTitle")} description={t("import.resultSummary", { total: formatNumber(result.totalRows) })}
          action={<StatusBadge tone={result.failedCount ? "warning" : "success"}><CheckCircle2 className="me-1 size-3" />{t("import.added", { count: result.successCount })}</StatusBadge>}>
          <div className="grid gap-3 sm:grid-cols-3">
            {([["added", result.successCount, "text-success"], ["updated", result.updatedCount, ""], ["failedRows", result.failedCount, result.failedCount ? "text-destructive" : ""]] as const).map(([k, v, tone]) => (
              <div key={k} className="flex flex-col gap-1 rounded-xl border px-4 py-3">
                <span className="text-xs text-muted-foreground">{t(`import.stat.${k}`)}</span>
                <span className={`text-lg font-semibold tabular-nums ${tone}`}>{formatNumber(v)}</span>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <Table className="mt-4 min-w-[520px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[t("import.row"), t("products.item"), t("import.reason")].map((h) => <TableHead key={h} className="text-muted-foreground">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="tabular-nums">{e.rowNumber}</TableCell>
                    <TableCell className="font-medium">{e.productName || "—"}</TableCell>
                    <TableCell className="text-destructive">{e.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}
    </>
  )
}
