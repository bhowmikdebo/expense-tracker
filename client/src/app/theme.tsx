import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('luma-theme') === 'light' ? 'light' : 'dark')
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('luma-theme', theme)
  }, [theme])
  return <ThemeContext.Provider value={{ theme, toggle: () => setTheme((value) => value === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('ThemeProvider is required.')
  return value
}
