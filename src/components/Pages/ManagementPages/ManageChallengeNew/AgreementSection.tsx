import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { useIntl } from '@/i18n'
import type { ChallengeFormValues } from './challengeFormSchema'

// Only shown while creating a challenge — see makeChallengeFormSchema, which
// only requires this agreement on create.
export const AgreementSection = () => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()

  return (
    <FormSection
      title={t({ id: 'manageChallengeNew.challengeForm.agreementSectionTitle', defaultMessage: 'Automated Edits Code of Conduct Agreement' }
      )}
      description={
        t(
          {
            id: 'manageChallengeNew.challengeForm.agreementDescription',
            defaultMessage:
              "You are about to create a MapRoulette challenge. With this power comes responsibility. Make sure that your Challenge is designed to encourage careful human attention to each task, in the spirit of OpenStreetMap's <link>Automated Edits code of conduct</link>. Please read this document carefully. By checking the box below, you acknowledge that you understand and accept this responsibility.",
          },
          {
            link: (chunks) => (
              <a
                href="https://wiki.openstreetmap.org/wiki/Automated_Edits_code_of_conduct"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {chunks}
              </a>
            ),
          }
        )
      }
    >
      <FormField
        control={form.control}
        name="automatedEditsCodeAgreement"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
            </FormControl>
            <div className="space-y-1">
              <FormLabel>
                {t({ id: 'manageChallengeNew.challengeForm.agreementCheckboxLabel', defaultMessage: 'I have read and understand the OSM Automated Edits code of conduct' }
                )}
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </FormSection>
  )
}
