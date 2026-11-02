import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  type IntlShape,
  IntlProvider as ReactIntlProvider,
  ReactIntlErrorCode,
  useIntl as useReactIntl,
} from 'react-intl'
import { defaultLocale, type Locale, resolveInitialLocale } from './locales'
import { baseCatalog, loadCatalog, type MessageCatalog } from './messageFormatting'

export type TranslateFn = IntlShape['formatMessage']

const LOCALE_STORAGE_KEY = 'mr4:locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

interface ProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

const ignoreMissingTranslations = (error: { code: string }) => {
  if (error.code === ReactIntlErrorCode.MISSING_TRANSLATION) return
  console.error(error)
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

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <LocaleContext.Provider value={value}>
      <ReactIntlProvider
        locale={locale}
        defaultLocale={defaultLocale}
        messages={catalog}
        onError={ignoreMissingTranslations}
      >
        {children}
      </ReactIntlProvider>
    </LocaleContext.Provider>
  )
}

export const useIntl = () => {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useIntl must be used within IntlProvider')
  const intl = useReactIntl()
  return useMemo(
    () => ({
      t: intl.formatMessage,
      formatNumber: intl.formatNumber,
      locale: ctx.locale,
      setLocale: ctx.setLocale,
    }),
    [intl, ctx.locale, ctx.setLocale]
  )
}
