import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ar from "./ar.json"
import en from "./en.json"
import bn from "./bn.json"

export const LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "bn", label: "Bangla", dir: "ltr", htmlLang: "bn-Latn" },
] as const
export type Lang = (typeof LANGUAGES)[number]["code"]

const KEY = "lang"
function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    return v === "en" || v === "bn" ? v : "ar"
  } catch {
    return "ar"
  }
}

export function applyDirection(lang: string) {
  const l = LANGUAGES.find((x) => x.code === lang)
  const dir = l?.dir ?? "rtl"
  document.documentElement.lang = l && "htmlLang" in l ? l.htmlLang : lang
  document.documentElement.dir = dir
}

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en }, bn: { translation: bn } },
  lng: readLang(),
  // A key missing from bn.json shows the English text, never the raw key.
  fallbackLng: { bn: ["en", "ar"], default: ["ar"] },
  interpolation: { escapeValue: false },
})
applyDirection(i18n.language)

i18n.on("languageChanged", (lng) => {
  applyDirection(lng)
  try {
    localStorage.setItem(KEY, lng)
  } catch {
    /* storage unavailable */
  }
})

export default i18n
