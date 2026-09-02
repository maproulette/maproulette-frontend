import type { UseFormReturn } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import type { ChallengeFormValues } from './challengeFormSchema'

interface BasicInfoFieldsProps {
  form: UseFormReturn<ChallengeFormValues>
  namePlaceholder: string
}

// The core identifying fields shared by both create and edit — name,
// description, instructions and difficulty.
export const BasicInfoFields = ({ form, namePlaceholder }: BasicInfoFieldsProps) => {
  const { t } = useIntl()

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.name', undefined, 'Name')}</FormLabel>
            <FormControl>
              <Input placeholder={namePlaceholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.description', undefined, 'Description')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t(
                  'manageChallengeNew.challengeForm.descriptionPlaceholder',
                  undefined,
                  'Describe what this challenge is about...'
                )}
                className="min-h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instruction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.instructions', undefined, 'Instructions')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t(
                  'manageChallengeNew.challengeForm.instructionsPlaceholder',
                  undefined,
                  'Instructions for completing tasks...'
                )}
                className="min-h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t(
                'manageChallengeNew.challengeForm.instructionsDescriptionBefore',
                undefined,
                'Shown to mappers with every task. Instructions support'
              )}{' '}
              <DocsLink page="markdown" icon={null}>
                {t('manageChallengeNew.challengeForm.markdownLinkText', undefined, 'Markdown')}
              </DocsLink>{' '}
              {t('manageChallengeNew.challengeForm.instructionsDescriptionAnd', undefined, 'and')}{' '}
              <DocsLink page="mustacheTagReplacement" icon={null}>
                {t(
                  'manageChallengeNew.challengeForm.mustacheTagsLinkText',
                  undefined,
                  'mustache tag replacement'
                )}
              </DocsLink>{' '}
              {t(
                'manageChallengeNew.challengeForm.instructionsDescriptionAfter',
                undefined,
                'so each task can show details from its own feature properties.'
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.difficulty', undefined, 'Difficulty')}</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'manageChallengeNew.challengeForm.difficultyPlaceholder',
                      undefined,
                      'Select difficulty'
                    )}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">{t('common.easy', undefined, 'Easy')}</SelectItem>
                <SelectItem value="2">{t('common.normal', undefined, 'Normal')}</SelectItem>
                <SelectItem value="3">{t('common.expert', undefined, 'Expert')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
