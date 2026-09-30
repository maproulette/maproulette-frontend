export const localeOptions = [
  { value: 'en-US', label: 'English (U.S.)' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'pt-BR', label: 'Português Brasileiro' },
  { value: 'pt-PT', label: 'Português Portugal' },
  { value: 'ru-RU', label: 'Русский' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'uk', label: 'Українська' },
  { value: 'vi', label: 'tiếng Việt' },
  { value: 'zh-TW', label: '國語' },
] as const

export type Locale = (typeof localeOptions)[number]['value']

export const supportedLocales: readonly Locale[] = localeOptions.map((option) => option.value)

export const defaultLocale: Locale = 'en-US'

export const isSupportedLocale = (value: string | undefined | null): value is Locale =>
  !!value && (supportedLocales as readonly string[]).includes(value)

export const resolveInitialLocale = (preferred?: string | null): Locale => {
  if (isSupportedLocale(preferred)) return preferred
  if (typeof navigator !== 'undefined') {
    const candidates = [navigator.language, ...(navigator.languages ?? [])]
    for (const candidate of candidates) {
      if (isSupportedLocale(candidate)) return candidate
      const prefix = candidate.split('-')[0]
      const match = supportedLocales.find((l) => l.startsWith(prefix))
      if (match) return match
    }
  }
  return defaultLocale
}
