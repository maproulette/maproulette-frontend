import type { UseFormReturn } from 'react-hook-form'
import { BASEMAP_CUSTOM, BASEMAP_NONE, bundledStyleNames } from '@/components/Map/basemap'
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
export const BasemapFields = ({ form }: { form: UseFormReturn<ChallengeFormValues> }) => {
  const { t } = useIntl()
  const basemap = form.watch('basemap')

  return (
    <FormSection
      title={t('manageChallengeNew.challengeForm.basemapTitle', undefined, 'Basemap')}
      description={t(
        'manageChallengeNew.challengeForm.basemapDescription',
        undefined,
        "Force a base layer for this challenge's maps, overriding the mapper's own choice."
      )}
    >
      <FormField
        control={form.control}
        name="basemap"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('manageChallengeNew.challengeForm.basemapLabel', undefined, 'Challenge basemap')}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={BASEMAP_NONE}>
                  {t(
                    'manageChallengeNew.challengeForm.basemapNone',
                    undefined,
                    "Don't override — mappers use their own"
                  )}
                </SelectItem>
                {bundledStyleNames().map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={BASEMAP_CUSTOM}>
                  {t(
                    'manageChallengeNew.challengeForm.basemapCustom',
                    undefined,
                    'Custom tile layer…'
                  )}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              <DocsLink page="settingBasemapForChallenge" icon={null}>
                {t(
                  'manageChallengeNew.challengeForm.basemapDocsLink',
                  undefined,
                  'About challenge basemaps'
                )}
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
                {t(
                  'manageChallengeNew.challengeForm.basemapUrlLabel',
                  undefined,
                  'Custom basemap URL'
                )}
              </FormLabel>
              <FormControl>
                <Input placeholder="https://some.imagerylayer.com/tile/{z}/{x}/{y}" {...field} />
              </FormControl>
              <FormDescription>
                {t(
                  'manageChallengeNew.challengeForm.basemapUrlDescription',
                  undefined,
                  'An XYZ tile template. Leave it blank and the challenge falls back to no override.'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </FormSection>
  )
}
