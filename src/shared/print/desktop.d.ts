/** Provided by the desktop app's preload script (desktop/preload.cjs); absent in the browser. */
interface Window {
  desktop?: {
    serverUrl: string
    printers: () => Promise<string[]>
    /** Silent print. `ok` means the job reached the printer's queue, not that paper came out; `info` names the build and print options used. */
    print: (html: string, printer: string, widthPx: number) => Promise<{ ok: boolean; reason?: string; size: string | null; info: string }>
    openPrintLog: () => Promise<void>
  }
}
