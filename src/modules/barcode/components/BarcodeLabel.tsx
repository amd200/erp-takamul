import { labelHtml, type LabelData } from "../label"
import type { LabelSettings } from "../settings"

/** The label at its real size. Labels print black on white whatever the screen theme is. */
export function BarcodeLabel({ data, settings }: { data: LabelData; settings: LabelSettings }) {
  return <div className="max-w-full overflow-auto rounded-sm shadow-md ring-1 ring-border" dangerouslySetInnerHTML={{ __html: labelHtml(data, settings) }} />
}
