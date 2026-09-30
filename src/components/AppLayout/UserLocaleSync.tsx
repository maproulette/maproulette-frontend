import { useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { isSupportedLocale, useIntl } from '@/i18n'

/**
 * Zero-DOM component that applies the signed-in user's saved language
 * preference to the intl provider, which sits above the auth provider and so
 * can't read it itself.
 */
export const UserLocaleSync = () => {
  const { user } = useAuthContext()
  const { locale, setLocale } = useIntl()
  const preferred = user?.settings?.locale

  useEffect(() => {
    if (isSupportedLocale(preferred) && preferred !== locale) {
      setLocale(preferred)
    }
  }, [preferred, locale, setLocale])

  return null
}
