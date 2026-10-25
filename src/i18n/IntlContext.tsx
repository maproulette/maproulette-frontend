import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type Locale, resolveInitialLocale } from './locales'
import {
  baseCatalog,
  type FormatValues,
  formatMessage,
  loadCatalog,
  type MessageCatalog,
} from './messageFormatting'

export type { TranslateFn } from './messageFormatting'

const LOCALE_STORAGE_KEY = 'mr4:locale'

interface IntlContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (id: string, values?: FormatValues, defaultMessage?: string) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const IntlContext = createContext<IntlContextValue | null>(null)

interface ProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

export const IntlProvider = ({ initialLocale, children }: ProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return resolveInitialLocale(initialLocale ?? stored ?? undefined)
  })
  const [catalog, setCatalog] = useState<MessageCatalog>(baseCatalog)

  useEffect(() => {
    let cancelled = false
    loadCatalog(locale).then((next) => {
      if (!cancelled) setCatalog(next)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const t = useCallback(
    (id: string, values?: FormatValues, defaultMessage?: string) => {
      const template = catalog[id] ?? defaultMessage ?? id
      return formatMessage(locale, template, values)
    },
    [catalog, locale]
  )

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, options).format(value),
    [locale]
  )

  const value = useMemo<IntlContextValue>(
    () => ({ locale, setLocale, t, formatNumber }),
    [locale, setLocale, t, formatNumber]
  )

  return <IntlContext.Provider value={value}>{children}</IntlContext.Provider>
}

export const useIntl = () => {
  const ctx = useContext(IntlContext)
  if (!ctx) throw new Error('useIntl must be used within IntlProvider')
  return ctx
}
