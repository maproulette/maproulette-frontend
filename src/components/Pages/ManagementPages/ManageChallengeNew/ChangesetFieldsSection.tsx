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
      title={t(
        'manageChallengeNew.challengeForm.changesetSectionTitle',
        undefined,
        'OpenStreetMap changeset'
      )}
      description={t(
        'manageChallengeNew.challengeForm.changesetSectionDescription',
        undefined,
        'Pre-filled in the editor when a mapper saves their changes to OpenStreetMap.'
      )}
    >
      <FormField
        control={form.control}
        name="checkinComment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'manageChallengeNew.challengeForm.checkinCommentLabel',
                undefined,
                'Changeset comment'
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t(
                  'manageChallengeNew.challengeForm.checkinCommentPlaceholder',
                  undefined,
                  'Fixed disconnected highways'
                )}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {isEdit
                ? t(
                    'manageChallengeNew.challengeForm.checkinCommentEditDescription',
                    undefined,
                    'Describes the changes mappers make. A link back to the task is added automatically.'
                  )
                : t(
                    'manageChallengeNew.challengeForm.checkinCommentCreateDescription',
                    undefined,
                    'Describes the changes mappers make. The #maproulette hashtag is appended if missing, and a link back to the task is added automatically.'
                  )}
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
              {t(
                'manageChallengeNew.challengeForm.checkinSourceLabel',
                undefined,
                'Changeset source'
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t(
                  'manageChallengeNew.challengeForm.checkinSourcePlaceholder',
                  undefined,
                  'Bing; survey'
                )}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t(
                'manageChallengeNew.challengeForm.checkinSourceDescription',
                undefined,
                'The imagery or data mappers are expected to use, separated by semicolons.'
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  )
}
