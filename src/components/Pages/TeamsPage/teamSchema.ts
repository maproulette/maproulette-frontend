import { z } from 'zod'
import type { TranslateFn } from '@/i18n'

export const makeTeamFormSchema = (t: TranslateFn) =>
  z.object({
    name: z
      .string()
      .min(1, t({ id: 'teams.form.nameRequired', defaultMessage: 'Name is required' }))
      .max(
        100,
        t(
          {
            id: 'teams.form.tooLong',
            defaultMessage:
              '{max, plural, one {Keep it under # character} other {Keep it under # characters}}',
          },
          { max: 100 }
        )
      ),
    description: z
      .string()
      .max(
        1000,
        t(
          {
            id: 'teams.form.tooLong',
            defaultMessage:
              '{max, plural, one {Keep it under # character} other {Keep it under # characters}}',
          },
          { max: 1000 }
        )
      )
      .optional(),
    avatarURL: z
      .url(t({ id: 'teams.form.invalidUrl', defaultMessage: 'Must be a valid URL' }))
      .optional()
      .or(z.literal('')),
  })

export type TeamFormValues = z.infer<ReturnType<typeof makeTeamFormSchema>>
