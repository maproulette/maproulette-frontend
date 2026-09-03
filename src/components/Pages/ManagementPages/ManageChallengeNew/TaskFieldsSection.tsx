import { useFormContext } from 'react-hook-form'
import { DocsLink } from '@/components/shared/DocsLink'
import { Checkbox } from '@/components/ui/Checkbox'
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
import { useIntl } from '@/i18n'
import type { ChallengeFormValues } from './challengeFormSchema'

/**
 * Challenge settings that govern how a challenge's tasks behave: which feature
 * property identifies the OSM element, and which MapRoulette tags mappers are
 * offered or restricted to.
 */
export const TaskFieldsSection = () => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()

  return (
    <FormSection
      title={t('manageChallengeNew.challengeForm.taskSettingsTitle', undefined, 'Task settings')}
      description={t(
        'manageChallengeNew.challengeForm.taskSettingsDescription',
        undefined,
        'How tasks in this challenge are identified and tagged.'
      )}
    >
      <FormField
        control={form.control}
        name="osmIdProperty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'manageChallengeNew.challengeForm.osmIdPropertyLabel',
                undefined,
                'OSM/External Id Property'
              )}
            </FormLabel>
            <FormControl>
              <Input placeholder="@id" {...field} />
            </FormControl>
            <FormDescription>
              {t(
                'manageChallengeNew.challengeForm.osmIdPropertyDescription',
                undefined,
                "The feature property holding each task's identifier. Leave blank to let MapRoulette detect it."
              )}{' '}
              <DocsLink page="externalTaskIdentifiers" icon={null}>
                {t(
                  'manageChallengeNew.challengeForm.osmIdPropertyDocsLink',
                  undefined,
                  'About task identifiers'
                )}
              </DocsLink>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preferredTags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'manageChallengeNew.challengeForm.preferredTagsLabel',
                undefined,
                'Preferred MR Tags (task completion)'
              )}
            </FormLabel>
            <FormControl>
              <Input placeholder="highway, surface, access" {...field} />
            </FormControl>
            <FormDescription>
              {t(
                'manageChallengeNew.challengeForm.preferredTagsDescription',
                undefined,
                'Comma-separated tags offered to mappers as suggestions when they complete a task.'
              )}{' '}
              <DocsLink page="maprouletteTags" icon={null}>
                {t(
                  'manageChallengeNew.challengeForm.preferredTagsDocsLink',
                  undefined,
                  'About MapRoulette tags'
                )}
              </DocsLink>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="limitTags"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="grid gap-1 leading-none">
              <FormLabel className="font-normal">
                {t(
                  'manageChallengeNew.challengeForm.limitTagsLabel',
                  undefined,
                  'Only allow the preferred tags above'
                )}
              </FormLabel>
              <FormDescription>
                {t(
                  'manageChallengeNew.challengeForm.limitTagsDescription',
                  undefined,
                  'Mappers cannot add tags outside the list, keeping exported tags consistent.'
                )}
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  )
}
