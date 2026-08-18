import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Form, FormField, formSubmitDisabled } from '@/components/ui/Form'
import { FormSectionGroup } from '@/components/ui/FormSection'
import { useAuthContext } from '@/contexts/AuthContext'
import { useChallengeFormContext } from '@/contexts/ChallengeFormContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { AgreementSection } from './AgreementSection'
import { BasicInfoFields } from './BasicInfoFields'
import {
  buildFormValues,
  type ChallengeFormValues,
  makeChallengeFormSchema,
} from './challengeFormSchema'
import { ProjectPickerField } from './ProjectPickerField'
import { TaskDataSection } from './TaskDataSection'

export type { ChallengeFormValues } from './challengeFormSchema'

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

  const handleSubmit = async (values: ChallengeFormValues) => {
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : t(
              'manageChallengeNew.challengeForm.saveErrorToast',
              undefined,
              'Failed to save challenge. Please try again.'
            )
      toast.error(errorMessage)
      logger.error('Failed to save challenge', { error: String(error) })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        <FormSectionGroup className="min-h-0 flex-1 overflow-y-auto pr-1">
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
            form={form}
            namePlaceholder={t(
              'manageChallengeNew.challengeForm.namePlaceholder',
              { user: user?.osmProfile.displayName ?? '' },
              "{user}'s Challenge"
            )}
          />

          <TaskDataSection
            form={form}
            dataSource={dataSource}
            challenge={challenge}
            sourceReadOnly={sourceReadOnly}
          />

          {!isEdit && <AgreementSection form={form} />}
        </FormSectionGroup>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
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
