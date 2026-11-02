import { z } from 'zod'
import type { TranslateFn } from '@/i18n'

export const makeTaskFormSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(
      3,
      t({
        id: 'manageTaskEdit.form.nameTooShort',
        defaultMessage: 'Name must be at least {min, plural, one {# character} other {# characters}}',
      }, { min: 3 })
    ),
    instruction: z.string().optional().or(z.literal('')),
    geometries: z
      .string()
      .min(1, t({ id: 'manageTaskEdit.form.geoJSONRequired', defaultMessage: 'GeoJSON is required' }))
      .refine(
        (val) => {
          try {
            JSON.parse(val)
            return true
          } catch {
            return false
          }
        },
        {
          message: t({
            id: 'manageTaskEdit.form.geoJSONInvalid',
            defaultMessage: 'GeoJSON must be valid JSON',
          }),
        }
      ),
    status: z.number().int().min(0),
  })

export type TaskFormValues = z.infer<ReturnType<typeof makeTaskFormSchema>>
