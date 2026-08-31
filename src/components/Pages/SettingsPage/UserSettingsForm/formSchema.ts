import z from 'zod'
import { baseMapOptions, editorOptions, localeOptions } from '@/data/account.json'

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
