import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { renderDocument } from "@/shared/print"
import { usePublicBranch } from "@/modules/pos/pos4/queries"
import { invoiceRollDoc } from "@/modules/sales/print/invoiceRollDoc"
import { printInvoiceOf } from "@/modules/sales/print/useInvoiceOutput"
import { enableInvoiceNotifications, isNotificationSupported, needsAddToHomeScreen, type NotifyResult } from "../pushClient"
import { followedInvoiceId, isFinalized, publicInvoiceApi } from "../service"
import { publicInvoiceKeys } from "../keys"

const POLL_MS = 4000

/**
 * Customer-facing, public page, opened from the store's shared QR (/qr?branchId=N) or from the push notification.
 * `GET /public/invoices/last` is the only data source: the held invoice and the final receipt both come from it, always
 * for the invoice this visitor locked on, so a newer invoice made by the cashier never takes over the page.
 */
export default function LastInvoicePage() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const branchId = params.get("branchId") ?? undefined
  const [notify, setNotify] = useState<NotifyResult | "idle">("idle")
  const storageKey = `followed-invoice-${branchId ?? "all"}`
  // The push opens /qr?branchId=..&invoiceId=<id>: that id wins over a stored one.
  const urlInvoiceId = Number(params.get("invoiceId")) || 0
  const [lockedId, setLockedId] = useState<number>(() => {
    if (urlInvoiceId) return urlInvoiceId
    try { return Number(sessionStorage.getItem(storageKey)) || 0 } catch { return 0 }
  })
  const lock = (id: number) => {
    setLockedId(id)
    try { sessionStorage.setItem(storageKey, String(id)) } catch { /* the lock then lives in memory only */ }
  }
  useEffect(() => { if (urlInvoiceId) lock(urlInvoiceId) }, [urlInvoiceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const last = useQuery({
    queryKey: publicInvoiceKeys.last(branchId, lockedId),
    queryFn: () => publicInvoiceApi.last(branchId, lockedId || undefined),
    retry: false,
    placeholderData: keepPreviousData,
    // Poll until the invoice is final: the page then shows the receipt without a push.
    refetchInterval: (q) => (q.state.status === "error" || (q.state.data && isFinalized(q.state.data)) ? false : POLL_MS),
  })
  const invoice = last.data
  const finalized = !!invoice && isFinalized(invoice)

  useEffect(() => { if (!lockedId && invoice && !finalized) lock(followedInvoiceId(invoice)) }, [invoice, lockedId, finalized]) // eslint-disable-line react-hooks/exhaustive-deps

  // Head tags for this page only (the back office is not installable): no phone links, and a manifest + touch icon so
  // "Add to Home Screen" installs a standalone web app. iOS only exposes Notification/PushManager there.
  useEffect(() => {
    const tags: HTMLElement[] = []
    const add = (tag: "meta" | "link", attrs: Record<string, string>) => {
      const el = document.createElement(tag)
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
      document.head.appendChild(el)
      tags.push(el)
    }
    add("meta", { name: "format-detection", content: "telephone=no" })
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" })
    add("meta", { name: "mobile-web-app-capable", content: "yes" })
    add("meta", { name: "apple-mobile-web-app-title", content: t("invTrack.appName") })
    add("link", { rel: "manifest", href: "/qr.webmanifest" })
    add("link", { rel: "apple-touch-icon", href: "/qr-icon-180.png" })
    return () => tags.forEach((el) => el.remove())
  }, [t])

  const branch = usePublicBranch()
  const receipt = useMemo(() => {
    if (!invoice?.items?.length) return null
    const doc = invoiceRollDoc(printInvoiceOf(invoice), {
      branch: branch.data, customer: undefined, isExempt: false, showPaymentMethods: true, showPaidAndRemaining: true,
      showBranchName: false, grid: false, showUnits: false, methodLabel: (m) => t(`sales.methods.${m}`),
    })
    return renderDocument(doc)
  }, [invoice, branch.data, t])

  const notifyTexts = useMemo(() => ({ title: t("invTrack.created"), body: t("invTrack.notifyBody") }), [t])
  // Only a held invoice can be subscribed to; a final invoice opened from the push has nothing to subscribe to.
  const pendingId = invoice && !finalized ? lockedId || followedInvoiceId(invoice) : 0
  const enable = async () => setNotify(await enableInvoiceNotifications(pendingId, notifyTexts))

  // Permission already granted earlier on this device: subscribe quietly, no tap needed.
  useEffect(() => {
    if (pendingId && notify === "idle" && isNotificationSupported() && Notification.permission === "granted") {
      void enableInvoiceNotifications(pendingId, notifyTexts).then(setNotify)
    }
  }, [pendingId, notify, notifyTexts])

  const showIosHint = useMemo(() => needsAddToHomeScreen(), [])
  const supported = isNotificationSupported()
  const blocked = notify === "denied" || (supported && Notification.permission === "denied")

  const notifyBar = invoice && !finalized && (
    <section className="mx-auto mb-3 max-w-sm rounded-2xl border bg-background p-4 text-center shadow-sm">
      <h1 className="text-base font-bold">{t("invTrack.created")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("invTrack.preparing")}</p>
      {notify === "enabled" ? (
        <p className="mt-3 text-sm text-green-600">{t("invTrack.enabled")}</p>
      ) : (
        <>
          {supported && !blocked && (
            <button type="button" onClick={enable} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">{t("invTrack.enable")}</button>
          )}
          {notify === "no-push" && <p className="mt-3 text-sm text-amber-600">{t("invTrack.noPush")}</p>}
          {(blocked || (!supported && !showIosHint) || notify === "unsupported" || notify === "error") && <p className="mt-3 text-sm text-amber-600">{t("invTrack.denied")}</p>}
        </>
      )}
      {showIosHint && <p className="mt-3 text-sm text-amber-600">{t("invTrack.iosHint")}</p>}
    </section>
  )

  let body
  if (last.isError) body = <Message role="alert">{t("invTrack.invalid")}</Message>
  else if (last.isSuccess && !invoice) body = <Message role="status">{t("invTrack.none")}</Message>
  else if (invoice) {
    body = (
      <>
        {notifyBar}
        {receipt ? <Receipt html={receipt} title={t(finalized ? "invTrack.ready" : "invTrack.created")} /> : <Message role="alert">{t("invTrack.renderError")}</Message>}
      </>
    )
  } else body = <Message role="status">{t("common.loading")}</Message>

  return <main dir={i18n.dir()} className="min-h-screen bg-muted/30 p-4">{body}</main>
}

/** The roll receipt in a frame of its own, as tall as its content. */
function Receipt({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(600)
  const fit = () => {
    const doc = ref.current?.contentDocument
    if (doc) setHeight(doc.documentElement.scrollHeight)
  }
  return (
    <div className="mx-auto w-fit bg-white shadow-sm">
      <iframe ref={ref} title={title} srcDoc={html} onLoad={fit} style={{ width: 302, height, border: 0, display: "block" }} />
    </div>
  )
}

const Message = ({ children, role }: { children: React.ReactNode; role: string }) => (
  <p role={role} className="py-24 text-center text-sm text-muted-foreground">{children}</p>
)
