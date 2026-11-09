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
import { CHALLENGE_CATEGORIES, type ChallengeCategory } from './challengeKeywords'

interface BasicInfoFieldsProps {
  namePlaceholder: string
}

// The core identifying fields shared by both create and edit — name,
// description, instructions and difficulty.
export const BasicInfoFields = ({ namePlaceholder }: BasicInfoFieldsProps) => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()

  const categoryLabels: Record<ChallengeCategory, string> = {
    navigation: t({
      id: 'common.category.navigation',
      defaultMessage: 'Roads / Pedestrian / Cycleways',
    }),
    water: t({ id: 'common.category.water', defaultMessage: 'Water' }),
    pointsOfInterest: t({
      id: 'common.category.pointsOfInterest',
      defaultMessage: 'Points / Areas of Interest',
    }),
    buildings: t({
      id: 'common.category.buildings',
      defaultMessage: 'Buildings',
    }),
    landUse: t({
      id: 'common.category.landUse',
      defaultMessage: 'Land Use / Administrative Boundaries',
    }),
    transit: t({
      id: 'common.category.transit',
      defaultMessage: 'Transit',
    }),
    other: t({ id: 'manageChallengeNew.challengeForm.category.other', defaultMessage: 'Other' }),
  }

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t({ id: 'common.name', defaultMessage: 'Name' })}</FormLabel>
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
            <FormLabel>{t({ id: 'common.description', defaultMessage: 'Description' })}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t({
                  id: 'manageChallengeNew.challengeForm.descriptionPlaceholder',
                  defaultMessage: 'Describe what this challenge is about...',
                })}
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
            <FormLabel>
              {t({ id: 'common.instructions', defaultMessage: 'Instructions' })}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t({
                  id: 'manageChallengeNew.challengeForm.instructionsPlaceholder',
                  defaultMessage: 'Instructions for completing tasks...',
                })}
                className="min-h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t(
                {
                  id: 'manageChallengeNew.challengeForm.instructionsDescription',
                  defaultMessage:
                    'Shown to mappers with every task. Instructions support <markdown>Markdown</markdown> and <mustache>mustache tag replacement</mustache> so each task can show details from its own feature properties.',
                },
                {
                  markdown: (chunks) => (
                    <DocsLink page="markdown" icon={null}>
                      {chunks}
                    </DocsLink>
                  ),
                  mustache: (chunks) => (
                    <DocsLink page="mustacheTagReplacement" icon={null}>
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

      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t({
                      id: 'manageChallengeNew.challengeForm.difficultyPlaceholder',
                      defaultMessage: 'Select difficulty',
                    })}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">
                  {t({ id: 'common.easy', defaultMessage: 'Easy' })}
                </SelectItem>
                <SelectItem value="2">
                  {t({ id: 'common.normal', defaultMessage: 'Normal' })}
                </SelectItem>
                <SelectItem value="3">
                  {t({ id: 'common.expert', defaultMessage: 'Expert' })}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.categoryLabel',
                defaultMessage: 'How should your Challenge be Categorized?',
              })}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CHALLENGE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {t({
                id: 'manageChallengeNew.challengeForm.categoryDescription',
                defaultMessage:
                  'Selecting an appropriate category for your challenge can help users discover challenges that match their interests. Choose the Other category if nothing seems appropriate.',
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additionalKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t({
                id: 'manageChallengeNew.challengeForm.additionalKeywordsLabel',
                defaultMessage: 'Additional Categorization Keywords',
              })}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {t({
                id: 'manageChallengeNew.challengeForm.additionalKeywordsDescription',
                defaultMessage:
                  'You can optionally provide additional keywords that can be used to aid discovery of your challenge.',
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
