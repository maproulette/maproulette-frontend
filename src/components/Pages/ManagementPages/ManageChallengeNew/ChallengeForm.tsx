import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Form, FormField, formSubmitDisabled } from '@/components/ui/Form'
import { FormSectionGroup } from '@/components/ui/FormSection'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useAuthContext } from '@/contexts/AuthContext'
import { useChallengeFormContext } from '@/contexts/ChallengeFormContext'
import { useIntl } from '@/i18n'
import { getErrorMessage } from '@/lib/apiError'
import { flattenFieldErrors } from '@/lib/formErrors'
import { logger } from '@/lib/logger'
import { AgreementSection } from './AgreementSection'
import { BasemapFields } from './BasemapFields'
import { BasicInfoFields } from './BasicInfoFields'
import { ChallengeTeamSection } from './ChallengeTeamSection'
import {
  buildFormValues,
  type ChallengeFormValues,
  makeChallengeFormSchema,
} from './challengeFormSchema'
import { ProjectPickerField } from './ProjectPickerField'
import { TaskDataSection } from './TaskDataSection'
import { TaskFieldsSection } from './TaskFieldsSection'

export type { ChallengeFormValues } from './challengeFormSchema'

// The backend rejects a duplicate challenge name with a 400 whose body reads
// "Challenge with name X already exists in the database". That one is about a
// specific field, so it's worth pinning to the name input rather than leaving it
// as an anonymous form-level failure.
const isNameConflict = (message: string) => {
  const lowered = message.toLowerCase()
  return lowered.includes('already exists') && lowered.includes('name')
}

export const ChallengeForm = () => {
  const { t } = useIntl()
  const { challenge, projectId, onSubmit, onCancel } = useChallengeFormContext()
  const { user } = useAuthContext()
  const isEdit = !!challenge
  const [pickerOpen, setPickerOpen] = useState(false)

  const resolver = useMemo(() => zodResolver(makeChallengeFormSchema(isEdit, t)), [isEdit, t])
  // Drive the form off `values` (not just `defaultValues`) so it reactively
  // fills once the challenge query resolves or the cache is refreshed —
  // `defaultValues` alone is read only on mount. `keepDirtyValues` keeps any
  // edits in progress from being clobbered by a background refetch.
  const values = useMemo(
    () => (challenge ? buildFormValues(challenge, projectId ?? 0) : undefined),
    [challenge, projectId]
  )

  const form = useForm<ChallengeFormValues>({
    resolver,
    defaultValues: buildFormValues(undefined, projectId ?? 0),
    values,
    resetOptions: { keepDirtyValues: true },
  })

  const dataSource = form.watch('dataSource')
  // The data source can only be set while creating. Once a challenge exists,
  // its tasks are already built from that source, so it's shown read-only here
  // (matching MR3) — regenerating tasks is done via Rebuild Tasks instead.
  const sourceReadOnly = isEdit

  const serverError = form.formState.errors.root?.serverError?.message
  // The form is taller than its scroll box, so a field marked invalid can sit
  // off screen with nothing but a disabled submit button to explain itself.
  // Every field error is restated down here, next to that button.
  const fieldErrors = flattenFieldErrors(form.formState.errors)

  // A server error describes the values as they were submitted, so retire the
  // banner as soon as the user starts changing them again.
  useEffect(() => {
    const subscription = form.watch(() => {
      if (form.formState.errors.root) form.clearErrors('root')
    })
    return () => subscription.unsubscribe()
  }, [form])

  const handleSubmit = async (values: ChallengeFormValues) => {
    form.clearErrors('root')
    try {
      await onSubmit(values)
      toast.success(
        challenge
          ? t(
              'manageChallengeNew.challengeForm.updateSuccessToast',
              undefined,
              'Challenge updated successfully'
            )
          : t(
              'manageChallengeNew.challengeForm.createSuccessToast',
              undefined,
              'Challenge created successfully'
            )
      )
    } catch (error) {
      const errorMessage = await getErrorMessage(
        error,
        t(
          'manageChallengeNew.challengeForm.saveErrorToast',
          undefined,
          'Failed to save challenge. Please try again.'
        )
      )
      if (isNameConflict(errorMessage)) {
        form.setError('name', { type: 'server', message: errorMessage }, { shouldFocus: true })
      }
      form.setError('root.serverError', { type: 'server', message: errorMessage })
      toast.error(errorMessage)
      logger.error('Failed to save challenge', { error: String(error) })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, () => form.clearErrors('root'))}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        {/* The scrollable body clips anything painted outside its padding box, so
            the horizontal padding leaves room for the selection rings drawn
            around the cards and image tiles below. */}
        <FormSectionGroup className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {!isEdit && (
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <ProjectPickerField
                  value={field.value}
                  onChange={field.onChange}
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                />
              )}
            />
          )}

          <BasicInfoFields
            namePlaceholder={t(
              'manageChallengeNew.challengeForm.namePlaceholder',
              { user: user?.osmProfile.displayName ?? '' },
              "{user}'s Challenge"
            )}
          />

          <TaskDataSection
            dataSource={dataSource}
            challenge={challenge}
            sourceReadOnly={sourceReadOnly}
          />

          <ChallengeTeamSection />

          <BasemapFields />

          <TaskFieldsSection />

          {!isEdit && <AgreementSection />}
        </FormSectionGroup>
        {serverError && (
          <Alert variant="destructive" className="mt-4 shrink-0">
            <AlertTitle>
              {challenge
                ? t(
                    'manageChallengeNew.challengeForm.updateErrorTitle',
                    undefined,
                    'Challenge could not be updated'
                  )
                : t(
                    'manageChallengeNew.challengeForm.createErrorTitle',
                    undefined,
                    'Challenge could not be created'
                  )}
            </AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
          {/* A field marked invalid can sit well outside the scrolled view, so
            the count sits by the submit button and names them on demand. */}
          {fieldErrors.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="mr-auto flex items-center gap-1.5 text-red-600 text-xs underline-offset-2 hover:underline dark:text-red-400"
                >
                  <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                  {t(
                    'manageChallengeNew.challengeForm.fieldErrorsTitle',
                    { count: fieldErrors.length },
                    '{count} fields need attention'
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="top"
                className="w-80 p-2"
                aria-label={t(
                  'manageChallengeNew.challengeForm.fieldErrorsAriaLabel',
                  undefined,
                  'Fields that need attention'
                )}
              >
                <ul className="space-y-0.5">
                  {fieldErrors.map((error) => (
                    <li key={error.name}>
                      <button
                        type="button"
                        // Scrolls the offending field back into view and focuses it.
                        onClick={() => form.setFocus(error.name as keyof ChallengeFormValues)}
                        className="w-full rounded px-2 py-1 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {error.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button type="submit" disabled={formSubmitDisabled(form.formState)}>
            {form.formState.isSubmitting
              ? t('common.saving2', undefined, 'Saving...')
              : challenge
                ? t('manageChallengeNew.challengeForm.updateButton', undefined, 'Update Challenge')
                : t('common.createChallenge', undefined, 'Create Challenge')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
