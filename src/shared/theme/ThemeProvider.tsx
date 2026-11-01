import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeChoice = "light" | "dark" | "system"
/** The look of the app: "modern" is the erpv2 look (default), "classic" is the current system's. */
export type UiStyle = "modern" | "classic"
type Ctx = { choice: ThemeChoice; resolved: "light" | "dark"; setChoice: (c: ThemeChoice) => void; style: UiStyle; setStyle: (s: UiStyle) => void }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = "theme"
const STYLE_KEY = "ui-style"
const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

function readStyle(): UiStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === "classic" ? "classic" : "modern"
  } catch {
    return "modern"
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice)
  const [style, setStyleState] = useState<UiStyle>(readStyle)
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener("change", onChange)
    return () => m.removeEventListener("change", onChange)
  }, [])

  const resolved = choice === "system" ? (systemDark ? "dark" : "light") : choice

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [resolved])

  useEffect(() => {
    document.documentElement.dataset.theme = style
  }, [style])

  const setStyle = (v: UiStyle) => {
    setStyleState(v)
    try {
      if (v === "modern") localStorage.removeItem(STYLE_KEY)
      else localStorage.setItem(STYLE_KEY, v)
    } catch {
      /* storage unavailable: keep the choice for this session only */
    }
  }

  const setChoice = (c: ThemeChoice) => {
    setChoiceState(c)
    try {
      if (c === "system") localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, c)
    } catch {
      /* storage unavailable: keep the choice for this session only */
    }
  }

  return <ThemeContext.Provider value={{ choice, resolved, setChoice, style, setStyle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}

/** True when the classic look is on; components whose callers restyle them pick their base classes with it. */
export function useClassic() {
  return useTheme().style === "classic"
}
