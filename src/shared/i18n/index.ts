import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ar from "./ar.json"
import en from "./en.json"

export const LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
] as const
export type Lang = (typeof LANGUAGES)[number]["code"]

const KEY = "lang"
function readLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "ar"
  } catch {
    return "ar"
  }
}

export function applyDirection(lang: string) {
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? "rtl"
  document.documentElement.lang = lang
  document.documentElement.dir = dir
}

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: readLang(),
  fallbackLng: "ar",
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
