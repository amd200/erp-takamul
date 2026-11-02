import * as qz from "qz-tray"
import { sha256 } from "js-sha256"
import { API_BASE_URL } from "@/shared/http/config"
import { useAuthStore } from "@/shared/auth/authStore"

/**
 * QZ Tray talks to the printers of this computer. The page proves who it is with the public certificate in
 * /qz-production and a signature the server makes for every request (POST /qz/sign), so the user is not asked each time.
 */
qz.api.setSha256Type((data: string) => sha256(data))
qz.api.setPromiseType((resolver: ConstructorParameters<typeof Promise<unknown>>[0]) => new Promise(resolver))

qz.security.setCertificatePromise((resolve: (v: string) => void, reject: (e: unknown) => void) => {
  fetch("/qz-production/certificate.pem", { cache: "no-store" })
    .then((res) => (res.ok ? res.text() : Promise.reject(res.statusText)))
    .then(resolve)
    .catch(reject)
})

qz.security.setSignatureAlgorithm("SHA512")
qz.security.setSignaturePromise((toSign: string) => (resolve: (v: string) => void, reject: (e: unknown) => void) => {
  const token = useAuthStore.getState().session?.accessToken
  fetch(`${API_BASE_URL.replace(/\/+$/, "")}/qz/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: toSign }),
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
    .then((body: { signature?: string }) => (body?.signature ? resolve(body.signature) : reject("No signature in response")))
    .catch(reject)
})

async function connect() {
  if (!qz.websocket.isActive()) await qz.websocket.connect()
}

// ESC/POS pulse on pin 2: 25 ms on, 250 ms off. Most receipt printers wire the drawer to it.
const DRAWER_PULSE = "\x1B\x70\x00\x19\xFA"

/** Opens the cash drawer without printing anything: through the branch's default printer, or the computer's default one. */
export async function openCashDrawer(printerName?: string | null) {
  await connect()
  const name = printerName || (await qz.printers.getDefault())
  if (!name) throw new Error("No printer configured")
  const printer = await qz.printers.find(name)
  await qz.print(qz.configs.create(printer), [{ type: "raw", format: "command", data: DRAWER_PULSE }])
}

/** The names of the printers installed on this computer. */
export async function listPrinters(): Promise<string[]> {
  await connect()
  const found = await qz.printers.find()
  return Array.isArray(found) ? found : found ? [found] : []
}
