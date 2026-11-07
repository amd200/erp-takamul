import { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { client } from "@/shared/http/client"

/**
 * Test-only (dev, or ?sim=1 on a built app): breaks the cashier's sale requests on purpose so the pending-sale / idempotency / cart-lock flow can be tried by hand.
 * Only the panel (loaded only when the simulator is on) imports this file, so it never reaches a production build.
 */
export type SimKey = "failBefore" | "dropAfter" | "http500" | "slow"
type Toggle = { on: boolean; once: boolean }
type SimState = Record<SimKey, Toggle> & {
  slowSeconds: number
  slowTimeout: boolean
  set: (k: SimKey, p: Partial<Toggle>) => void
  setSlow: (p: Partial<Pick<SimState, "slowSeconds" | "slowTimeout">>) => void
  turnOff: (k: SimKey) => void
  reset: () => void
}

const off: Toggle = { on: false, once: true }
const initial = { failBefore: off, dropAfter: off, http500: off, slow: off, slowSeconds: 10, slowTimeout: false }

export const useSimStore = create<SimState>()(persist((set) => ({
  ...initial,
  set: (k, p) => set((s) => ({ [k]: { ...s[k], ...p } }) as Partial<SimState>),
  setSlow: (p) => set(p),
  turnOff: (k) => set((s) => ({ [k]: { ...s[k], on: false } }) as Partial<SimState>),
  reset: () => set(initial),
}), { name: "dev-pos-sim" }))

/** Number of sale requests the simulation has touched; the panel shows it. */
export const useSimLog = create<{ log: string[]; add: (m: string) => void; clear: () => void }>((set) => ({
  log: [],
  add: (m) => set((s) => ({ log: [`${new Date().toLocaleTimeString()}  ${m}`, ...s.log].slice(0, 30) })),
  clear: () => set({ log: [] }),
}))

type Plan = { dropAfter: boolean; http500: boolean; slow: number; slowTimeout: boolean }
type Simulated = InternalAxiosRequestConfig & { _sim?: Plan }

/** The sale endpoints only: takeaway, delivery, dine-in, checkout and releasing a held order. */
const isSale = (c: InternalAxiosRequestConfig) => {
  const m = (c.method ?? "get").toLowerCase()
  const url = c.url ?? ""
  return (m === "post" && /\/sales-orders\/pos\/(takeaway|delivery|indine)/.test(url)) || (m === "post" && /\/sales-orders\/\d+\/release-holding/.test(url))
}

const take = (k: SimKey) => {
  const t = useSimStore.getState()[k]
  if (!t.on) return false
  if (t.once) useSimStore.getState().turnOff(k)
  return true
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

client.interceptors.request.use((config) => {
  const c = config as Simulated
  if (c._sim || !isSale(c)) return config
  const log = useSimLog.getState().add
  const key = String(c.headers?.["Idempotency-Key"] ?? "-")
  if (take("failBefore")) {
    log(`1 فشل قبل الإرسال (مفتاح ${key.slice(0, 8)})`)
    c._sim = { dropAfter: false, http500: false, slow: 0, slowTimeout: false }
    throw new AxiosError("Network Error", "ERR_NETWORK", c)
  }
  const s = useSimStore.getState()
  c._sim = { dropAfter: take("dropAfter"), http500: take("http500"), slow: take("slow") ? s.slowSeconds : 0, slowTimeout: s.slowTimeout }
  log(`أُرسل (مفتاح ${key.slice(0, 8)})${c._sim.dropAfter ? " + ضياع الرد" : ""}${c._sim.http500 ? " + 500" : ""}${c._sim.slow ? ` + بطء ${c._sim.slow}ث` : ""}`)
  return c
})

client.interceptors.response.use(async (res) => {
  const plan = (res.config as Simulated)._sim
  if (!plan) return res
  const log = useSimLog.getState().add
  if (plan.slow) await wait(plan.slow * 1000)
  if (plan.slow && plan.slowTimeout) {
    log("انتهت المهلة بعد وصول الطلب للسيرفر")
    throw new AxiosError("timeout of simulated ms exceeded", "ECONNABORTED", res.config, res.request)
  }
  if (plan.dropAfter) {
    log("الرد اتشال: الطلب وصل للسيرفر")
    throw new AxiosError("Network Error", "ERR_NETWORK", res.config, res.request)
  }
  if (plan.http500) {
    log("رد 500 مزيّف: الطلب وصل للسيرفر")
    throw new AxiosError("Request failed with status code 500", "ERR_BAD_RESPONSE", res.config, res.request, { ...res, status: 500, statusText: "Internal Server Error", data: { message: "Simulated server error" } })
  }
  return res
})
