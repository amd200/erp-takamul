import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeChoice = "light" | "dark"
type Ctx = { choice: ThemeChoice; resolved: ThemeChoice; setChoice: (c: ThemeChoice) => void }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = "theme"

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice)
  const resolved = choice

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [resolved])

  const setChoice = (c: ThemeChoice) => {
    setChoiceState(c)
    try {
      localStorage.setItem(KEY, c)
    } catch {
      /* storage unavailable: keep the choice for this session only */
    }
  }

  return <ThemeContext.Provider value={{ choice, resolved, setChoice }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
