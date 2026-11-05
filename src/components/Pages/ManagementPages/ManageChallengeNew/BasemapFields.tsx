import { useFormContext } from 'react-hook-form'
import {
  BASEMAP_CURRENT,
  BASEMAP_CUSTOM,
  BASEMAP_NONE,
  bundledStyleNames,
} from '@/components/Map/basemap'
import { DocsLink } from '@/components/shared/DocsLink'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import type { ChallengeFormValues } from './challengeFormSchema'

/**
 * Basemap the challenge forces on its maps, overriding whatever the mapper has
 * chosen for themselves. Useful when a challenge can only be judged against
 * particular imagery.
 */
export const BasemapFields = () => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()
  const basemap = form.watch('basemap')
  const hasUnsupportedBasemap = form.formState.defaultValues?.basemap === BASEMAP_CURRENT

  return (
    <FormSection
      title={t({ id: 'manageChallengeNew.challengeForm.basemapTitle', defaultMessage: 'Basemap' })}
      description={t({
        id: 'manageChallengeNew.challengeForm.basemapDescription',
        defaultMessage:
          "Force a base layer for this challenge's maps, overriding the mapper's own choice.",
      })}
    >
      <FormField
        control={form.control}
        name="basemap"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.basemapLabel',
                defaultMessage: 'Challenge basemap',
              })}
            </FormLabel>
            <Select onValueChange={(value) => value && field.onChange(value)} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {hasUnsupportedBasemap && (
                  <SelectItem value={BASEMAP_CURRENT}>
                    {t({
                      id: 'manageChallengeNew.challengeForm.basemapCurrent',
                      defaultMessage: 'Keep the current basemap',
                    })}
                  </SelectItem>
                )}
                <SelectItem value={BASEMAP_NONE}>
                  {t({
                    id: 'manageChallengeNew.challengeForm.basemapNone',
                    defaultMessage: "Don't override — mappers use their own",
                  })}
                </SelectItem>
                {bundledStyleNames().map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={BASEMAP_CUSTOM}>
                  {t({
                    id: 'manageChallengeNew.challengeForm.basemapCustom',
                    defaultMessage: 'Custom tile layer…',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              <DocsLink page="settingBasemapForChallenge" icon={null}>
                {t({
                  id: 'manageChallengeNew.challengeForm.basemapDocsLink',
                  defaultMessage: 'About challenge basemaps',
                })}
              </DocsLink>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {basemap === BASEMAP_CUSTOM && (
        <FormField
          control={form.control}
          name="basemapUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t({
                  id: 'manageChallengeNew.challengeForm.basemapUrlLabel',
                  defaultMessage: 'Custom basemap URL',
                })}
              </FormLabel>
              <FormControl>
                <Input placeholder="https://some.imagerylayer.com/tile/{z}/{x}/{y}" {...field} />
              </FormControl>
              <FormDescription>
                {t({
                  id: 'manageChallengeNew.challengeForm.basemapUrlDescription',
                  defaultMessage:
                    'An XYZ tile template. Leave it blank and the challenge falls back to no override.',
                })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </FormSection>
  )
}
