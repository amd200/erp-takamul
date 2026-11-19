/** Provided by the desktop app's preload script (desktop/preload.cjs); absent in the browser. */
interface Window {
  desktop?: {
    printers: () => Promise<string[]>
    print: (html: string, printer: string) => Promise<boolean>
  }
}
