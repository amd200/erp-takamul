import { http, HttpResponse } from "msw"
import { getDb } from "../db"
import { api, body, ok } from "../lib/http"

/** The older groups have their own addresses; every `tabs/<name>` maps to `<name>Tab` ("print-a4" -> "printA4Tab"). */
const OLD_GROUPS: Record<string, string> = { sales: "sales", Printting: "print", tax: "taxSetting", tobacco: "tobaccoFees", barcode: "barcodeScale", whatsapp: "whatsApp" }
const tabGroup = (slug: string) => slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()) + "Tab"

async function save(group: string, request: Request) {
  await getDb().settings.put({ group, value: await body(request) })
  return ok()
}

export const settingsHandlers = [
  http.get(api("/Settings"), async () => {
    const rows = await getDb().settings.toArray()
    return HttpResponse.json(Object.fromEntries(rows.map((r) => [r.group, r.value])))
  }),
  http.put(api("/Settings/tabs/:tab"), ({ params, request }) => save(tabGroup(String(params.tab)), request)),
  http.put(api("/Settings/:group"), ({ params, request }) => {
    const group = OLD_GROUPS[String(params.group)]
    return group ? save(group, request) : ok()
  }),
]
