import { useFormContext } from 'react-hook-form'
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

interface ChangesetFieldsSectionProps {
  isEdit: boolean
}

export const ChangesetFieldsSection = ({ isEdit }: ChangesetFieldsSectionProps) => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()

  return (
    <FormSection
      title={t({
        id: 'manageChallengeNew.challengeForm.changesetSectionTitle',
        defaultMessage: 'OpenStreetMap changeset',
      })}
      description={t({
        id: 'manageChallengeNew.challengeForm.changesetSectionDescription',
        defaultMessage:
          'Pre-filled in the editor when a mapper saves their changes to OpenStreetMap.',
      })}
    >
      <FormField
        control={form.control}
        name="checkinComment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.checkinCommentLabel',
                defaultMessage: 'Changeset comment',
              })}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t({
                  id: 'manageChallengeNew.challengeForm.checkinCommentPlaceholder',
                  defaultMessage: 'Fixed disconnected highways',
                })}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {isEdit
                ? t({
                    id: 'manageChallengeNew.challengeForm.checkinCommentEditDescription',
                    defaultMessage:
                      'Describes the changes mappers make. A link back to the task is added automatically.',
                  })
                : t({
                    id: 'manageChallengeNew.challengeForm.checkinCommentCreateDescription',
                    defaultMessage:
                      'Describes the changes mappers make. The #maproulette hashtag is appended if missing, and a link back to the task is added automatically.',
                  })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="checkinSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.checkinSourceLabel',
                defaultMessage: 'Changeset source',
              })}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t({
                  id: 'manageChallengeNew.challengeForm.checkinSourcePlaceholder',
                  defaultMessage: 'Bing; survey',
                })}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t({
                id: 'manageChallengeNew.challengeForm.checkinSourceDescription',
                defaultMessage:
                  'The imagery or data mappers are expected to use, separated by semicolons.',
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  )
}
