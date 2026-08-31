import { z } from 'zod'

export const taskFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  instruction: z.string().optional().or(z.literal('')),
  geometries: z
    .string()
    .min(1, 'GeoJSON is required')
    .refine(
      (val) => {
        try {
          JSON.parse(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'GeoJSON must be valid JSON' }
    ),
  status: z.number().int().min(0),
  errorTags: z.string().optional().or(z.literal('')),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
