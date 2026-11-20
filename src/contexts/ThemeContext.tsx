import { Monitor, Moon, Sun } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useIntl } from '@/i18n'
import { localStored, useStored } from '@/lib/storage'

const Theme = z.enum(['dark', 'light', 'system'])

type Theme = z.infer<typeof Theme>

const storedTheme = localStored('theme', Theme, 'system')

type ThemeOption = { key: Theme; icon: React.ElementType; label: string }

const themeMeta: { key: Theme; icon: React.ElementType }[] = [
  { key: 'system', icon: Monitor },
  { key: 'light', icon: Sun },
  { key: 'dark', icon: Moon },
]

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  handleSetTheme: (theme: Theme) => void
  themes: ThemeOption[]
}

const initialState: ThemeContextType = {
  theme: 'system',
  setTheme: () => null,
  handleSetTheme: () => null,
  themes: [
    { key: 'system', icon: Monitor, label: 'System theme' },
    { key: 'light', icon: Sun, label: 'Light theme' },
    { key: 'dark', icon: Moon, label: 'Dark theme' },
  ],
}

const ThemeProviderContext = createContext<ThemeContextType>(initialState)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useIntl()
  const [theme, setTheme] = useStored(storedTheme)

  const themeLabels: Record<Theme, string> = useMemo(
    () => ({
      system: t({ id: 'theme.options.system', defaultMessage: 'System theme' }),
      light: t({ id: 'theme.options.light', defaultMessage: 'Light theme' }),
      dark: t({ id: 'theme.options.dark', defaultMessage: 'Dark theme' }),
    }),
    [t]
  )

  const themes: ThemeOption[] = useMemo(
    () => themeMeta.map((item) => ({ ...item, label: themeLabels[item.key] })),
    [themeLabels]
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(
    () => ({
      theme,
      setTheme,
      handleSetTheme: setTheme,
      themes,
    }),
    [theme, setTheme, themes]
  )

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export const useThemeContext = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
