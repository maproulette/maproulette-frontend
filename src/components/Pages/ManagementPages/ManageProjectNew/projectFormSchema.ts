import { z } from 'zod'
import type { useIntl } from '@/i18n'

type T = ReturnType<typeof useIntl>['t']

// Building the schema requires translated validation messages, so it's built
// from a function (called from within the component, where `t` is available)
// rather than as a static module-level constant.
export const makeProjectFormSchema = (t: T) =>
  z.object({
    name: z
      .string()
      .min(
        1,
        t(
          'manageProjectNew.projectForm.validation.nameRequired',
          undefined,
          'Project name is required'
        )
      )
      .max(255),
    displayName: z
      .string()
      .min(
        1,
        t(
          'manageProjectNew.projectForm.validation.displayNameRequired',
          undefined,
          'Display name is required'
        )
      )
      .max(255),
    description: z.string().optional().or(z.literal('')),
    enabled: z.boolean(),
    featured: z.boolean(),
  })

export type ProjectFormValues = z.infer<ReturnType<typeof makeProjectFormSchema>>
