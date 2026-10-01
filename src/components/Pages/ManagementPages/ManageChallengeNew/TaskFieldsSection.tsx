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

interface TaskFieldsSectionProps {
  dataSource: ChallengeFormValues['dataSource']
}

/**
 * Challenge settings that govern how a challenge's tasks behave: which feature
 * property identifies the OSM element, which property groups features into a
 * single multi-feature task, and which MapRoulette tags mappers are offered or
 * restricted to.
 */
export const TaskFieldsSection = ({ dataSource }: TaskFieldsSectionProps) => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()
  const bundlingUnavailable = dataSource === 'overpass'

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
        name="taskBundleIdProperty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'manageChallengeNew.challengeForm.taskBundleIdPropertyLabel',
                undefined,
                'Task Bundle Id Property'
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="bundle_id"
                disabled={bundlingUnavailable}
                title={
                  bundlingUnavailable
                    ? t(
                        'manageChallengeNew.challengeForm.taskBundleIdPropertyOverpassWarning',
                        undefined,
                        'Grouping features into one task is not available for Overpass queries. Choose a GeoJSON source to use it.'
                      )
                    : undefined
                }
                {...field}
              />
            </FormControl>
            <FormDescription>
              {bundlingUnavailable
                ? t(
                    'manageChallengeNew.challengeForm.taskBundleIdPropertyOverpassWarning',
                    undefined,
                    'Grouping features into one task is not available for Overpass queries. Choose a GeoJSON source to use it.'
                  )
                : t(
                    'manageChallengeNew.challengeForm.taskBundleIdPropertyDescription',
                    undefined,
                    'The feature property to treat as a bundle id. Features sharing a value become a single task with multiple features; features without the property stay as separate tasks. Leave blank for one task per feature.'
                  )}
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
