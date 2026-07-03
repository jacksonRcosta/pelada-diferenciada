import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const KEY = 'pd_theme'
const ThemeContext = createContext(null)

// Lê o tema salvo; padrão é claro (light). Exportada para aplicar o tema
// no boot (index.js), antes do primeiro paint, evitando "flash" de tema.
export function readTheme() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' } catch { return 'light' }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const setTheme = useCallback(t => {
    try { localStorage.setItem(KEY, t) } catch {}
    setThemeState(t)
  }, [])

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(KEY, next) } catch {}
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
