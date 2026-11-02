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
import { FormSection } from '@/components/ui/FormSection'
import { Input } from '@/components/ui/Input'
import { useIntl } from '@/i18n'
import type { ChallengeFormValues } from './challengeFormSchema'

interface TaskFieldsSectionProps {
  dataSource: ChallengeFormValues['dataSource']
}

/**
 * Challenge settings that govern how a challenge's tasks behave: which feature
 * property identifies the OSM element, and which property groups features into
 * a single multi-feature task.
 */
export const TaskFieldsSection = ({ dataSource }: TaskFieldsSectionProps) => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()
  const bundlingUnavailable = dataSource === 'overpass'

  return (
    <FormSection
      title={t({
        id: 'manageChallengeNew.challengeForm.taskSettingsTitle',
        defaultMessage: 'Task settings',
      })}
      description={t({
        id: 'manageChallengeNew.challengeForm.taskSettingsDescription',
        defaultMessage: 'How tasks in this challenge are identified and grouped.',
      })}
    >
      <FormField
        control={form.control}
        name="osmIdProperty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.osmIdPropertyLabel',
                defaultMessage: 'OSM/External Id Property',
              })}
            </FormLabel>
            <FormControl>
              <Input placeholder="@id" {...field} />
            </FormControl>
            <FormDescription>
              {t({
                id: 'manageChallengeNew.challengeForm.osmIdPropertyDescription',
                defaultMessage:
                  "The feature property holding each task's identifier. Leave blank to let MapRoulette detect it.",
              })}{' '}
              <DocsLink page="externalTaskIdentifiers" icon={null}>
                {t({
                  id: 'manageChallengeNew.challengeForm.osmIdPropertyDocsLink',
                  defaultMessage: 'About task identifiers',
                })}
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
              {t({
                id: 'manageChallengeNew.challengeForm.taskBundleIdPropertyLabel',
                defaultMessage: 'Task Bundle Id Property',
              })}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="bundle_id"
                disabled={bundlingUnavailable}
                title={
                  bundlingUnavailable
                    ? t({
                        id: 'manageChallengeNew.challengeForm.taskBundleIdPropertyOverpassWarning',
                        defaultMessage:
                          'Grouping features into one task is not available for Overpass queries. Choose a GeoJSON source to use it.',
                      })
                    : undefined
                }
                {...field}
              />
            </FormControl>
            <FormDescription>
              {bundlingUnavailable
                ? t({
                    id: 'manageChallengeNew.challengeForm.taskBundleIdPropertyOverpassWarning',
                    defaultMessage:
                      'Grouping features into one task is not available for Overpass queries. Choose a GeoJSON source to use it.',
                  })
                : t({
                    id: 'manageChallengeNew.challengeForm.taskBundleIdPropertyDescription',
                    defaultMessage:
                      'The feature property to treat as a bundle id. Features sharing a value become a single task with multiple features; features without the property stay as separate tasks. Leave blank for one task per feature.',
                  })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  )
}
