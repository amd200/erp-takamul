import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertTriangle, BellOff, BellRing, ChefHat, CheckCircle2, ClipboardCheck, Download, Loader2, PackageCheck, ReceiptText, Share, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { downloadPdf, renderDocument } from "@/shared/print"
import { usePublicBranch } from "@/modules/pos/pos4/queries"
import { invoiceRollDoc, type InvoiceRollOptions } from "@/modules/sales/print/invoiceRollDoc"
import { printInvoiceOf } from "@/modules/sales/print/useInvoiceOutput"
import { orderRequestDoc } from "@/modules/order-requests/print/orderRequestDoc"
import { enableInvoiceNotifications, isNotificationSupported, needsAddToHomeScreen, type NotifyResult } from "../pushClient"
import { followedRecord, isFinalized, type FollowedRecord, type LastInvoice } from "../service"
import { useLastInvoice } from "../queries"

/** iOS Safari turns phone numbers into blue tel: links; the receipt must look like the printed one. */
const NO_PHONE_LINKS = `<meta name="format-detection" content="telephone=no"><style>a[href^="tel"]{color:inherit!important;text-decoration:none!important;pointer-events:none}</style>`
const withoutPhoneLinks = (html: string) => (html.includes("</head>") ? html.replace("</head>", `${NO_PHONE_LINKS}</head>`) : NO_PHONE_LINKS + html)

const validId = (v: unknown) => {
  const id = Number(v)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

/**
 * Customer-facing, public page, opened from the store's shared QR (/qr?branchId=N), an invoice's QR, or the push
 * notification. `GET /public/invoices/last` is the only data source, always for the request or invoice this visitor
 * locked on, so a newer record made by the cashier never takes over the page.
 */
export default function LastInvoicePage() {
  const [params] = useSearchParams()
  // A new branch or notification link starts its own tracking session.
  return <Tracking key={`${params.get("branchId")}:${params.get("invoiceId")}:${params.get("orderRequestId")}`} params={params} />
}

function Tracking({ params }: { params: URLSearchParams }) {
  const { t, i18n } = useTranslation()
  const branchId = params.get("branchId") ?? undefined
  // The cashier's QR adds notify=0 when the branch has notifications off (a public visitor has no settings).
  const notificationsOff = params.get("notify") === "0"
  const [notify, setNotify] = useState<NotifyResult | "idle">("idle")
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfFailed, setPdfFailed] = useState(false)
  const storageKey = `followed-record-${branchId ?? "all"}`
  const [locked, setLocked] = useState<FollowedRecord | null>(() => {
    const invoiceId = validId(params.get("invoiceId"))
    const orderRequestId = validId(params.get("orderRequestId"))
    if (invoiceId) return { invoiceId }
    if (orderRequestId) return { orderRequestId }
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null")
      if (validId(saved?.invoiceId) && !saved?.orderRequestId) return { invoiceId: validId(saved.invoiceId) }
      if (validId(saved?.orderRequestId) && !saved?.invoiceId) return { orderRequestId: validId(saved.orderRequestId) }
    } catch { /* the lock then lives in memory only */ }
    return null
  })
  useEffect(() => {
    if (!locked) return
    try { sessionStorage.setItem(storageKey, JSON.stringify(locked)) } catch { /* the lock then lives in memory only */ }
  }, [locked, storageKey])

  const last = useLastInvoice(branchId, locked)
  const record: LastInvoice | null | undefined = last.data

  // Lock on the first record shown; once a request is checked out, follow the invoice it became.
  const linkedInvoiceId = record?.recordType === "OrderRequest" ? validId(record.data.salesOrderId) : 0
  if (linkedInvoiceId && locked?.invoiceId !== linkedInvoiceId) setLocked({ invoiceId: linkedInvoiceId })
  else if (!locked && record) setLocked(followedRecord(record))

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

  const finalized = !!record && isFinalized(record)
  const isRequest = record?.recordType === "OrderRequest"
  const requestStatus = isRequest ? (record.data.status ?? "").trim().toLowerCase() : ""
  // Keep the "converted to an invoice" heading after an order link switches to the issued invoice.
  const orderInvoiced = requestStatus === "invoiced" || (finalized && validId(params.get("orderRequestId")) > 0)
  // A pushed pickup link carries the issued invoice's id; a release link carries the held one's.
  const pickupReady = requestStatus === "ready" || (finalized && params.get("pickup") === "1" && validId(params.get("invoiceId")) === record.data.id)
  const green = orderInvoiced || pickupReady || finalized
  const title = t(orderInvoiced ? "invTrack.orderInvoiced"
    : pickupReady ? "invTrack.pickupReady"
    : requestStatus === "orderreceived" ? "invTrack.orderReceived"
    : finalized ? "invTrack.orderPreparing" : "invTrack.created")

  const branch = usePublicBranch()
  const doc = useMemo(() => {
    if (!record?.data.items?.length) return null
    const options: InvoiceRollOptions = {
      branch: branch.data, customer: undefined, isExempt: false, showPaymentMethods: !isRequest, showPaidAndRemaining: !isRequest,
      showBranchName: false, grid: false, showUnits: false, methodLabel: (m) => t(`sales.methods.${m}`, { defaultValue: m }),
    }
    return record.recordType === "OrderRequest" ? orderRequestDoc(record.data, options) : invoiceRollDoc(printInvoiceOf(record.data), options)
  }, [record, isRequest, branch.data, t])
  const html = useMemo(() => (doc ? withoutPhoneLinks(renderDocument(doc)) : null), [doc])

  // Built in the browser from the receipt on screen, so it needs no token or extra endpoint.
  const savePdf = async () => {
    if (!doc || !record || pdfBusy) return
    setPdfBusy(true)
    setPdfFailed(false)
    try { await downloadPdf(doc, `Receipt_${record.data.orderNumber || record.data.id}.pdf`) }
    catch { setPdfFailed(true) }
    finally { setPdfBusy(false) }
  }

  const notifyTexts = useMemo(() => ({ title: t("invTrack.created"), body: t("invTrack.notifyBody") }), [t])
  const target = useMemo(() => locked ?? (record ? followedRecord(record) : null), [locked, record])
  const [enabling, setEnabling] = useState(false)
  const enable = async () => {
    if (!target || enabling) return
    setEnabling(true)
    try { setNotify(await enableInvoiceNotifications(target, notifyTexts)) } finally { setEnabling(false) }
  }

  // Permission already granted earlier on this device: subscribe quietly, no tap and no local notification.
  useEffect(() => {
    if (!notificationsOff && target && notify === "idle" && isNotificationSupported() && Notification.permission === "granted") {
      void enableInvoiceNotifications(target).then(setNotify)
    }
  }, [notificationsOff, target, notify])

  const showIosHint = useMemo(() => needsAddToHomeScreen(), [])
  const supported = isNotificationSupported()
  const blocked = notify === "denied" || (supported && Notification.permission === "denied")
  const hideControls = notificationsOff || orderInvoiced || pickupReady
  const renderError = t(isRequest ? "invTrack.orderRenderError" : "invTrack.renderError")

  // Shown for held and final records alike. It never replaces the receipt: it only offers to turn notifications on.
  const tone: Tone = green ? "success" : requestStatus === "orderreceived" ? "info" : "pending"
  const StatusIcon = orderInvoiced ? ReceiptText : pickupReady ? PackageCheck : finalized ? ChefHat : requestStatus === "orderreceived" ? ClipboardCheck : CheckCircle2
  const showDenied = blocked || (!supported && !showIosHint) || notify === "unsupported" || notify === "error"
  const notifyBar = record && (
    <section className="mx-auto mb-4 w-full max-w-[340px] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className={cn("h-1 w-full", TONES[tone].bar)} />
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        <span className={cn("flex size-14 items-center justify-center rounded-full", TONES[tone].icon)}><StatusIcon className="size-7" strokeWidth={2} /></span>
        <div className="space-y-1">
          <h1 className={cn("text-lg font-bold leading-snug", TONES[tone].title)}>{title}</h1>
          {!finalized && !isRequest && <p className="text-sm leading-relaxed text-muted-foreground">{t("invTrack.preparing")}</p>}
        </div>
        {!hideControls && (
          <div className="flex w-full flex-col gap-2.5 pt-1">
            {notify === "enabled" ? (
              !finalized && !isRequest && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BellRing className="size-4 shrink-0" />{t("invTrack.orderPreparing")}
                </div>
              )
            ) : (
              <>
                {supported && !blocked && (
                  <Button type="button" size="lg" className="h-12 w-full gap-2 rounded-xl text-base font-bold" disabled={enabling} onClick={() => void enable()}>
                    {enabling ? <Loader2 className="size-5 animate-spin" /> : <BellRing className="size-5" />}{t("invTrack.enable")}
                  </Button>
                )}
                {notify === "no-push" && <Notice>{t("invTrack.noPush")}</Notice>}
                {showDenied && <Notice icon={BellOff}>{t("invTrack.denied")}</Notice>}
              </>
            )}
            {showIosHint && <Notice icon={Share}>{t("invTrack.iosHint")}</Notice>}
          </div>
        )}
      </div>
    </section>
  )

  let body
  if (last.isError) body = <Message role="alert">{t("invTrack.invalid")}</Message>
  else if (last.isSuccess && !record) body = <Message role="status">{t("invTrack.none")}</Message>
  else if (record) {
    body = (
      <>
        {notifyBar}
        {html ? <Receipt html={html} title={title} /> : <Message role="alert">{renderError}</Message>}
        {html && (
          <div className="mx-auto mt-4 flex w-full max-w-[340px] flex-col gap-2.5">
            <Button type="button" variant="outline" size="lg" className="h-12 w-full gap-2 rounded-xl bg-card font-bold" onClick={() => void savePdf()} disabled={pdfBusy}>
              {pdfBusy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
              {pdfBusy ? t("common.loading") : t(isRequest ? "invTrack.orderDownloadPdf" : "invTrack.downloadPdf")}
            </Button>
            {pdfFailed && <Notice>{renderError}</Notice>}
          </div>
        )}
      </>
    )
  } else body = <Message role="status">{t("common.loading")}</Message>

  return <main dir={i18n.dir()} className="min-h-dvh bg-muted/40 px-4 py-6 text-foreground">{body}</main>
}

/** The roll receipt in a frame of its own, as tall as its content. */
function Receipt({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(600)
  const fit = () => {
    const f = ref.current
    const d = f?.contentDocument
    if (!f || !d) return
    // Measured at a tiny height, so the frame's own viewport does not count as content (no blank tail under the receipt).
    f.style.height = "1px"
    setHeight(d.documentElement.scrollHeight + 12)
  }
  return (
    <div className="mx-auto w-fit overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
      <iframe ref={ref} title={title} srcDoc={html} onLoad={fit} style={{ width: 302, height, border: 0, display: "block" }} />
    </div>
  )
}

type Tone = "success" | "info" | "pending"
/** The status card's colours: green once ready / final, blue for a received order, the brand colour while it is being made. */
const TONES: Record<Tone, { bar: string; icon: string; title: string }> = {
  success: { bar: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400", title: "text-emerald-700 dark:text-emerald-400" },
  info: { bar: "bg-sky-500", icon: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400", title: "text-foreground" },
  pending: { bar: "bg-primary", icon: "bg-primary/10 text-primary", title: "text-foreground" },
}

/** A short warning under the status (notifications off, iPhone hint, ...). */
function Notice({ children, icon: Icon = AlertTriangle }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-start text-[13px] leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

const Message = ({ children, role }: { children: React.ReactNode; role: string }) => (
  <p role={role} className="py-24 text-center text-sm text-muted-foreground">{children}</p>
)
