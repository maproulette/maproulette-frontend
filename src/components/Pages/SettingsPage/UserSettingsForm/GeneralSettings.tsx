import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
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
import { baseMapOptions, editorOptions, localeOptions } from '@/data/account.json'
import { FieldSubmit } from './FieldSubmit'
import type { formSchema } from './formSchema'

export const GeneralSettings = ({
  form,
  children,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>
  children?: ReactNode
}) => {
  return (
    <FieldSet>
      <FieldLegend>General</FieldLegend>
      <FieldDescription>Update your general account settings and preferences.</FieldDescription>
      <FieldGroup>
        <FormField
          control={form.control}
          name="locale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a default language" />
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
                Choose your preferred language (locale) for the interface.
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
                <FormLabel>Default Editor</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a default editor" />
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
                  Choose your preferred editor for mapping tasks.{' '}
                  <DocsLink page="defaultOsmEditor" icon={null}>
                    Learn about the editor choices
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
                <FormLabel>Default Basemap</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(Number.isNaN(Number(value)) ? value : Number(value))
                  }
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a default basemap" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {baseMapOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the default map background for your tasks.{' '}
                  <DocsLink page="mapBaseLayer" icon={null}>
                    Learn about base layers
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
              <FormLabel>Custom Basemap URL</FormLabel>
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
