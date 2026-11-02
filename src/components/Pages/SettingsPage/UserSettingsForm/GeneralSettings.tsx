import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { BASEMAP_CURRENT } from '@/components/Map/basemap'
import { DocsLink } from '@/components/shared/DocsLink'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/Field'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { baseMapOptions, editorOptions } from '@/data/account.json'
import { localeOptions, useIntl } from '@/i18n'
import { FieldSubmit } from './FieldSubmit'
import type { SettingsFormValues } from './formSchema'

export const GeneralSettings = ({
  form,
  children,
}: {
  form: UseFormReturn<SettingsFormValues>
  children?: ReactNode
}) => {
  const { t } = useIntl()
  return (
    <FieldSet className="min-h-0 flex-auto">
      <FieldLegend>{t({ id: 'settings.general.title', defaultMessage: 'General' })}</FieldLegend>
      <FieldDescription>
        {t({
          id: 'settings.general.description',
          defaultMessage: 'Update your general account settings and preferences.',
        })}
      </FieldDescription>
      <FieldGroup className="min-h-0 flex-auto overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="locale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t({ id: 'settings.general.languageLabel', defaultMessage: 'Language' })}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t({
                        id: 'settings.general.languagePlaceholder',
                        defaultMessage: 'Select a default language',
                      })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {localeOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t({
                  id: 'settings.general.languageDescription',
                  defaultMessage: 'Choose your preferred language (locale) for the interface.',
                })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="defaultEditor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t({ id: 'settings.general.editorLabel', defaultMessage: 'Default Editor' })}
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t({
                          id: 'settings.general.editorPlaceholder',
                          defaultMessage: 'Select a default editor',
                        })}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {editorOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t({
                    id: 'settings.general.editorDescription',
                    defaultMessage: 'Choose your preferred editor for mapping tasks.',
                  })}{' '}
                  <DocsLink page="defaultOsmEditor" icon={null}>
                    {t({
                      id: 'settings.general.editorDocsLink',
                      defaultMessage: 'Learn about the editor choices',
                    })}
                  </DocsLink>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultBasemap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t({ id: 'settings.general.basemapLabel', defaultMessage: 'Default Basemap' })}
                </FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(Number.isNaN(Number(value)) ? value : Number(value))
                  }
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t({
                          id: 'settings.general.basemapPlaceholder',
                          defaultMessage: 'Select a default basemap',
                        })}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {form.formState.defaultValues?.defaultBasemap === BASEMAP_CURRENT && (
                      <SelectItem value={BASEMAP_CURRENT}>
                        {t({
                          id: 'settings.general.basemapKeepCurrent',
                          defaultMessage: 'Keep current basemap',
                        })}
                      </SelectItem>
                    )}
                    {baseMapOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t({
                    id: 'settings.general.basemapDescription',
                    defaultMessage: 'Choose the default map background for your tasks.',
                  })}{' '}
                  <DocsLink page="mapBaseLayer" icon={null}>
                    {t({
                      id: 'settings.general.basemapDocsLink',
                      defaultMessage: 'Learn about base layers',
                    })}
                  </DocsLink>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="defaultBasemapId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t({
                  id: 'settings.general.customBasemapLabel',
                  defaultMessage: 'Custom Basemap URL',
                })}
              </FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/tiles/{z}/{x}/{y}.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {children}
      </FieldGroup>
      <FieldSubmit isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </FieldSet>
  )
}
