import { useEffect } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import { usePluginContext } from '@/contexts/PluginContext'
import type { UserSettings } from '@/types/User'
import type { formSchema } from './formSchema'

type SettingsFormValues = z.infer<typeof formSchema>

/** Renders plugin-owned settings inputs bound to the shared Account form. */
export const PluginUserSettingsFields = ({
  form,
  settings,
}: {
  form: UseFormReturn<SettingsFormValues>
  settings: UserSettings
}) => {
  const { userSettingsFields: fields } = usePluginContext()

  useEffect(() => {
    for (const pluginField of fields) {
      const settingsRecord = settings as Record<string, unknown>
      if (settingsRecord[pluginField.name] !== undefined) {
        form.setValue(
          pluginField.name as FieldPath<SettingsFormValues>,
          settingsRecord[pluginField.name] as SettingsFormValues[FieldPath<SettingsFormValues>]
        )
      }
    }
  }, [fields, form, settings])

  if (fields.length === 0) return null

  return (
    <>
      {fields.map((pluginField) => {
        const FieldComponent = pluginField.component
        return (
          <FormField
            key={pluginField.id}
            control={form.control}
            name={pluginField.name as FieldPath<SettingsFormValues>}
            render={({ field }) => (
              <FormItem>
                <FieldComponent
                  value={field.value}
                  onChange={field.onChange}
                  disabled={form.formState.isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )
      })}
    </>
  )
}
