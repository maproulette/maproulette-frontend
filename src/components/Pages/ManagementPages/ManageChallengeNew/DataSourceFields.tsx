import { useId } from 'react'
import { useFormContext } from 'react-hook-form'
import { DocsLink } from '@/components/shared/DocsLink'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { ChallengeFormValues } from './challengeFormSchema'

interface DataSourceFieldsProps {
  dataSource: ChallengeFormValues['dataSource']
}

// The editable "task data" controls shown while creating a challenge: a
// choice of data source plus whichever field that choice requires. Only
// rendered while creating — once a challenge exists the source is read-only
// (see TaskDataReadOnly).
export const DataSourceFields = ({ dataSource }: DataSourceFieldsProps) => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()
  const overpassId = useId()
  const localGeoJSONId = useId()
  const remoteGeoJSONId = useId()

  return (
    <>
      <FormField
        control={form.control}
        name="dataSource"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 gap-4"
              >
                <label
                  htmlFor={overpassId}
                  className={cn(
                    'flex cursor-pointer items-start space-x-3 rounded-lg border border-zinc-200 p-4 transition-all dark:border-slate-700',
                    field.value === 'overpass'
                      ? 'bg-blue-50/60 ring-2 ring-blue-500 hover:bg-blue-100/60 dark:bg-blue-950/30 dark:ring-blue-400 dark:hover:bg-blue-950/50'
                      : 'hover:bg-zinc-50 dark:hover:bg-slate-900/50'
                  )}
                >
                  <RadioGroupItem value="overpass" id={overpassId} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {t({ id: 'manageChallengeNew.challengeForm.overpassOptionTitle', defaultMessage: 'I want to provide an Overpass query' }
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t({ id: 'manageChallengeNew.challengeForm.overpassOptionDescription', defaultMessage: 'Use Overpass QL to automatically generate tasks from OpenStreetMap data' }
                      )}
                    </p>
                  </div>
                </label>
                <label
                  htmlFor={localGeoJSONId}
                  className={cn(
                    'flex cursor-pointer items-start space-x-3 rounded-lg border border-zinc-200 p-4 transition-all dark:border-slate-700',
                    field.value === 'localGeoJSON'
                      ? 'bg-blue-50/60 ring-2 ring-blue-500 hover:bg-blue-100/60 dark:bg-blue-950/30 dark:ring-blue-400 dark:hover:bg-blue-950/50'
                      : 'hover:bg-zinc-50 dark:hover:bg-slate-900/50'
                  )}
                >
                  <RadioGroupItem value="localGeoJSON" id={localGeoJSONId} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {t({ id: 'manageChallengeNew.challengeForm.localGeoJSONOptionTitle', defaultMessage: 'I want to upload a GeoJSON file' }
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t({ id: 'manageChallengeNew.challengeForm.localGeoJSONOptionDescription', defaultMessage: 'Upload a GeoJSON file from your computer' }
                      )}
                    </p>
                  </div>
                </label>
                <label
                  htmlFor={remoteGeoJSONId}
                  className={cn(
                    'flex cursor-pointer items-start space-x-3 rounded-lg border border-zinc-200 p-4 transition-all dark:border-slate-700',
                    field.value === 'remoteGeoJSON'
                      ? 'bg-blue-50/60 ring-2 ring-blue-500 hover:bg-blue-100/60 dark:bg-blue-950/30 dark:ring-blue-400 dark:hover:bg-blue-950/50'
                      : 'hover:bg-zinc-50 dark:hover:bg-slate-900/50'
                  )}
                >
                  <RadioGroupItem value="remoteGeoJSON" id={remoteGeoJSONId} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {t({ id: 'manageChallengeNew.challengeForm.remoteGeoJSONOptionTitle', defaultMessage: 'I have a URL to the GeoJSON data' }
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t({ id: 'manageChallengeNew.challengeForm.remoteGeoJSONOptionDescription', defaultMessage: 'Provide a URL pointing to a GeoJSON file' }
                      )}
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Overpass QL Field */}
      {dataSource === 'overpass' && (
        <FormField
          control={form.control}
          name="overpassQL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t({ id: 'manageChallengeNew.challengeForm.overpassQLLabel', defaultMessage: 'Overpass QL' })}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="[out:xml][timeout:25];(way[highway=primary];);out meta;"
                  className="min-h-32 resize-none font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t(
                  {
                    id: 'manageChallengeNew.challengeForm.overpassQLDescription',
                    defaultMessage:
                      'Overpass query language to automatically generate tasks for this challenge. Please see the <docs>docs</docs> for important details and common pitfalls when creating challenges using Overpass queries.',
                  },
                  {
                    docs: (chunks) => (
                      <DocsLink page="overpassChallenges" icon={null}>
                        {chunks}
                      </DocsLink>
                    ),
                  }
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {dataSource === 'localGeoJSON' && (
        <FormField
          control={form.control}
          name="localGeoJSON"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>
                {t({ id: 'manageChallengeNew.challengeForm.geoJSONFileLabel', defaultMessage: 'GeoJSON File' })}
              </FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept=".geojson,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      onChange(file)
                    }}
                    {...field}
                  />
                  {value && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t({ id: 'manageChallengeNew.challengeForm.geoJSONFileSelected', defaultMessage: 'Selected: {name} ({size, number, ::.00} KB)' }, { name: value.name, size: value.size / 1024 }
                      )}
                    </p>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {t(
                  {
                    id: 'manageChallengeNew.challengeForm.geoJSONFileDescription',
                    defaultMessage:
                      'Upload a GeoJSON file from your computer. Standard GeoJSON and <docs>line-by-line GeoJSON format</docs> are supported.',
                  },
                  {
                    docs: (chunks) => (
                      <DocsLink page="lineByLineGeoJSON" icon={null}>
                        {chunks}
                      </DocsLink>
                    ),
                  }
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Remote GeoJSON URL */}
      {dataSource === 'remoteGeoJSON' && (
        <FormField
          control={form.control}
          name="remoteGeoJSON"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t({ id: 'common.geojsonUrl', defaultMessage: 'GeoJSON URL' })}</FormLabel>
              <FormControl>
                <Input placeholder="https://www.example.com/geojson.json" type="url" {...field} />
              </FormControl>
              <FormDescription>
                {t({ id: 'manageChallengeNew.challengeForm.remoteGeoJSONDescription', defaultMessage: 'Provide a URL pointing to a GeoJSON file. The URL should point directly to the raw GeoJSON file, not a page that contains a link to the file.' }
                )}{' '}
                {t(
                  {
                    id: 'manageChallengeNew.challengeForm.remoteGeoJSONDocs',
                    defaultMessage: '<docs>Hosting your GeoJSON in a GitHub gist</docs> is one way to do that.',
                  },
                  {
                    docs: (chunks) => (
                      <DocsLink page="gistsForRemoteGeoJSON" icon={null}>
                        {chunks}
                      </DocsLink>
                    ),
                  }
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
}
