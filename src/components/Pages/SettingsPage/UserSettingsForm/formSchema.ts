import z from 'zod'
import { BASEMAP_CURRENT, CHALLENGE_BASEMAP } from '@/components/Map/basemap'
import { baseMapOptions, editorOptions } from '@/data/account.json'
import type { TranslateFn } from '@/i18n'
import { type Locale, localeOptions, normalizeLocale } from '@/i18n/locales'
import type { UserSettings } from '@/types/User'

export const makeFormSchema = (t: TranslateFn) =>
  z
    .object({
      defaultEditor: z
        .number()
        .refine((val) => editorOptions.some((option) => option.value === val), {
          message: t({
            id: 'settings.general.invalidEditor',
            defaultMessage: 'Invalid editor option',
          }),
        })
        .optional(),
      defaultBasemap: z
        .union([z.number(), z.string()])
        .refine(
          (val) => val === BASEMAP_CURRENT || baseMapOptions.some((option) => option.value === val),
          {
            message: t({
              id: 'settings.general.invalidBasemap',
              defaultMessage: 'Invalid basemap option',
            }),
          }
        ),
      defaultBasemapId: z.string().optional(),
      locale: z
        .string()
        .refine((val) => localeOptions.some((option) => option.value === val), {
          message: t({
            id: 'settings.general.invalidLanguage',
            defaultMessage: 'Invalid language option',
          }),
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

export type SettingsFormValues = z.infer<ReturnType<typeof makeFormSchema>>

const LAYER_ID_FOR_BASEMAP: Record<number, string> = {
  [CHALLENGE_BASEMAP.openStreetMap]: 'MAPNIK',
  [CHALLENGE_BASEMAP.openCycleMap]: 'tf-cycle',
  [CHALLENGE_BASEMAP.bing]: 'Bing',
}

const basemapSelection = ({ defaultBasemap, defaultBasemapId }: UserSettings): number | string => {
  if (defaultBasemap == null || defaultBasemap === CHALLENGE_BASEMAP.none) {
    return CHALLENGE_BASEMAP.none
  }
  const layerId =
    defaultBasemap === CHALLENGE_BASEMAP.identified
      ? defaultBasemapId
      : LAYER_ID_FOR_BASEMAP[defaultBasemap]
  return baseMapOptions.some((option) => option.value === layerId) && layerId
    ? layerId
    : BASEMAP_CURRENT
}

const basemapUrl = (settings: UserSettings): string =>
  settings.defaultBasemap === CHALLENGE_BASEMAP.identified ? '' : (settings.defaultBasemapId ?? '')

export const basemapSettings = (
  values: SettingsFormValues,
  settings: UserSettings
): Pick<UserSettings, 'defaultBasemap' | 'defaultBasemapId'> => {
  const url = values.defaultBasemapId ?? ''
  if (values.defaultBasemap === basemapSelection(settings) && url === basemapUrl(settings)) {
    return { defaultBasemap: settings.defaultBasemap, defaultBasemapId: settings.defaultBasemapId }
  }
  if (values.defaultBasemap === BASEMAP_CURRENT) {
    return { defaultBasemap: settings.defaultBasemap, defaultBasemapId: url }
  }
  if (typeof values.defaultBasemap === 'string') {
    return { defaultBasemap: CHALLENGE_BASEMAP.identified, defaultBasemapId: values.defaultBasemap }
  }
  return { defaultBasemap: values.defaultBasemap, defaultBasemapId: url }
}

export const getDefaultValues = (
  settings: UserSettings,
  fallbackLocale: Locale
): SettingsFormValues => ({
  defaultEditor: settings.defaultEditor ?? -1,
  defaultBasemap: basemapSelection(settings),
  defaultBasemapId: basemapUrl(settings),
  email: settings.email ?? '',
  locale: normalizeLocale(settings.locale) ?? fallbackLocale,
})
