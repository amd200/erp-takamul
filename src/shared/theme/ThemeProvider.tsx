import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeChoice = "light" | "dark" | "system"
export type Accent = "default" | "green"
type Ctx = { choice: ThemeChoice; resolved: "light" | "dark"; setChoice: (c: ThemeChoice) => void; accent: Accent; setAccent: (a: Accent) => void }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = "theme"
const ACCENT_KEY = "accent"
const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

function readAccent(): Accent {
  try {
    return localStorage.getItem(ACCENT_KEY) === "green" ? "green" : "default"
  } catch {
    return "default"
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice)
  const [accent, setAccentState] = useState<Accent>(readAccent)
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
    document.documentElement.classList.toggle("theme-green", accent === "green")
  }, [accent])

  const setAccent = (a: Accent) => {
    setAccentState(a)
    try {
      if (a === "default") localStorage.removeItem(ACCENT_KEY)
      else localStorage.setItem(ACCENT_KEY, a)
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

  return <ThemeContext.Provider value={{ choice, resolved, setChoice, accent, setAccent }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
