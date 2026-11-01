import { useRef, useState } from "react"
import { CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionCard } from "@/components/SectionCard"

export type PreviewRow = { cells: string[]; error?: string }

/** Upload → review → import, shared by every Excel import screen. */
export function ImportPanel({ headers, preview, onImport, pending }: {
  headers: string[]
  preview: PreviewRow[]
  onImport: (fileName: string) => void
  pending?: boolean
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<string | null>(null)
  const valid = preview.filter((r) => !r.error).length

  return (
    <>
      <SectionCard title={t("import.step1")} description={t("import.step1Hint")}
        action={<Button variant="outline"><Download />{t("import.template")}</Button>}>
        <input ref={input} type="file" accept=".xlsx,.xls" className="sr-only" id="import-file"
          onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]?.name ?? null) }}
          className="grid w-full place-items-center rounded-xl border border-dashed px-6 py-10 text-muted-foreground hover:border-primary hover:bg-secondary/40">
          <span className="flex flex-col items-center gap-1.5">
            {file ? <FileSpreadsheet className="size-8 text-primary" /> : <UploadCloud className="size-8 text-faint" />}
            <span className="font-medium text-foreground">{file ?? t("import.drop")}</span>
            <span className="text-xs text-faint">{t("import.limits")}</span>
          </span>
        </button>
      </SectionCard>

      {file && (
        <SectionCard title={t("import.step2")} description={t("import.summary", { total: preview.length, bad: preview.length - valid })}
          action={<StatusBadge tone="success"><CheckCircle2 className="me-1 size-3" />{t("import.ready", { count: valid })}</StatusBadge>}>
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {[...headers, t("common.status")].map((h) => <TableHead key={h} className="text-xs text-muted-foreground">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((r, i) => (
                <TableRow key={i}>
                  {r.cells.map((c, j) => <TableCell key={j} className={j === 0 ? "font-medium" : undefined}>{c || "—"}</TableCell>)}
                  <TableCell><StatusBadge tone={r.error ? "danger" : "success"}>{r.error ?? t("import.valid")}</StatusBadge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" size="lg" onClick={() => setFile(null)}>{t("common.cancel")}</Button>
            <Button size="lg" disabled={pending || valid === 0} onClick={() => onImport(file)}>{t("import.submit")}</Button>
          </div>
        </SectionCard>
      )}
    </>
  )
}
