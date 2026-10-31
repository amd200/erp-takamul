import { useEffect, useRef, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Upload, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { ProductForm } from "../schema"

const MAX_IMAGE = 2 * 1024 * 1024

/** The picture of the item, as in the current system: a dashed drop area with a browse button, and the chosen picture under it. */
export function ImagePanel() {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const image = useWatch({ control, name: "image" })
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview(typeof image === "string" && image ? image : null)
  }, [image])

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setError(t("products.imageType"))
    if (file.size > MAX_IMAGE) return setError(t("products.imageTooBig"))
    setError(null)
    setValue("image", file, { shouldDirty: true })
  }

  return (
    <div className="lg:col-span-2">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={t("productForm.uploadLabel")}
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
        className="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-border p-6 text-center">
        <div className="flex items-center justify-center rounded-full border p-2.5"><Upload className="size-6 text-muted-foreground" /></div>
        <p className="text-sm font-medium">{t("productForm.dragImage")}</p>
        <p className="text-xs text-muted-foreground">{t("productForm.orBrowse")}</p>
        <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={() => input.current?.click()}>{t("productForm.browse")}</Button>
      </div>
      {preview && (
        <div className="relative mt-3 w-fit">
          <img src={preview} alt="" className="size-32 rounded-lg border border-gray-200 object-cover" />
          <Button type="button" variant="ghost" size="icon" aria-label={t("common.remove")} onClick={() => setValue("image", null, { shouldDirty: true })}
            className="absolute -end-2 -top-2 size-6 rounded-full border border-gray-200 bg-white"><X size={12} /></Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
