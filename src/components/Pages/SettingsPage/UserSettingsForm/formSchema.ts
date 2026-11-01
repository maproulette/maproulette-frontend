import z from 'zod'
import { baseMapOptions, editorOptions } from '@/data/account.json'
import { type Locale, localeOptions, normalizeLocale } from '@/i18n/locales'
import type { UserSettings } from '@/types/User'

export const formSchema = z
  .object({
    defaultEditor: z
      .number()
      .refine((val) => editorOptions.some((option) => option.value === val), {
        message: 'Invalid editor option',
      })
      .optional(),
    defaultBasemap: z
      .union([z.number(), z.string()])
      .refine((val) => baseMapOptions.some((option) => option.value === val), {
        message: 'Invalid basemap option',
      }),
    defaultBasemapId: z.string().optional(),
    locale: z
      .string()
      .refine((val) => localeOptions.some((option) => option.value === val), {
        message: 'Invalid language option',
      })
      .optional(),
    email: z.email().optional().or(z.literal('')),
    emailOptIn: z.boolean().optional(),
    leaderboardOptOut: z.boolean().optional(),
    theme: z.number().min(0).max(2).optional(),
    disableTaskConfirm: z.boolean().optional(),
  })
  // Allow plugin-contributed settings fields (e.g. from getUserSettingsFields)
  .loose()

export const getDefaultValues = (
  settings: UserSettings,
  fallbackLocale: Locale
): z.infer<typeof formSchema> => ({
  defaultEditor: settings.defaultEditor ?? -1,
  defaultBasemap: settings.defaultBasemap ?? -1,
  defaultBasemapId: settings.defaultBasemapId ?? '',
  email: settings.email ?? '',
  locale: normalizeLocale(settings.locale) ?? fallbackLocale,
})
