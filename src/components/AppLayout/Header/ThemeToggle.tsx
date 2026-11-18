import { Moon, Sun } from 'lucide-react'
import { useThemeContext } from '@/contexts/ThemeContext'
import { useIntl } from '@/i18n'

/**
 * A plain light/dark mode switch for users who aren't signed in. Users who are
 * signed in can switch the theme from the user menu instead.
 */
export const ThemeToggle = () => {
  const { t } = useIntl()
  const { theme, handleSetTheme } = useThemeContext()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      type="button"
      className="flex cursor-pointer rounded-sm hover:text-link"
      onClick={() => handleSetTheme(isDark ? 'light' : 'dark')}
      aria-label={
        isDark
          ? t({
              id: 'appLayout.header.themeToggle.toLight',
              defaultMessage: 'Switch to light theme',
            })
          : t({ id: 'appLayout.header.themeToggle.toDark', defaultMessage: 'Switch to dark theme' })
      }
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  )
}
