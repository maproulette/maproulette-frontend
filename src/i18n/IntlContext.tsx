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
  ReactIntlErrorCode,
  IntlProvider as ReactIntlProvider,
  useIntl as useReactIntl,
} from 'react-intl'
import { z } from 'zod'
import { localStored } from '@/lib/storage'
import { defaultLocale, isSupportedLocale, type Locale, resolveInitialLocale } from './locales'
import { baseCatalog, loadCatalog, type MessageCatalog } from './messageFormatting'

export type TranslateFn = IntlShape['formatMessage']

const storedLocale = localStored(
  'locale',
  z.custom<Locale>((value) => typeof value === 'string' && isSupportedLocale(value)).nullable(),
  null
)

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
  const [locale, setLocaleState] = useState<Locale>(() =>
    resolveInitialLocale(initialLocale ?? storedLocale.get())
  )
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
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    storedLocale.set(next)
    setLocaleState(next)
  }, [])

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
