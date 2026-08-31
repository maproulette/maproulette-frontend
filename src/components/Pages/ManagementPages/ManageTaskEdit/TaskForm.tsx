import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TASK_STATUS_OPTIONS } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Button } from '@/components/ui/Button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  formSubmitDisabled,
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
import { logger } from '@/lib/logger'
import type { TaskGetResponse } from '@/types/Task'
import { type TaskFormValues, taskFormSchema } from './taskFormSchema'

export type { TaskFormValues } from './taskFormSchema'

interface TaskFormProps {
  task: TaskGetResponse
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancel: () => void
}

const geometriesToString = (geometries: unknown): string => JSON.stringify(geometries, null, 2)

export const TaskForm = ({ task, onSubmit, onCancel }: TaskFormProps) => {
  const { t } = useIntl()
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task.name ?? '',
      instruction: task.instruction ?? '',
      geometries: geometriesToString(task.geometries),
      status: task.status ?? 0,
      errorTags: typeof task.errorTags === 'string' ? task.errorTags : '',
    },
  })

  const handleSubmit = async (values: TaskFormValues) => {
    try {
      await onSubmit(values)
      toast.success(t('manageTaskEdit.form.updateSuccess', undefined, 'Task updated successfully'))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t(
              'manageTaskEdit.form.updateError',
              undefined,
              'Failed to save task. Please try again.'
            )
      toast.error(message)
      logger.error('Failed to save task', { error: String(error) })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.name', undefined, 'Name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('manageTaskEdit.form.namePlaceholder', undefined, 'Task name')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('manageTaskEdit.form.nameDescription', undefined, 'Name of the task')}
                </FormDescription>
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
                      'manageTaskEdit.form.instructionsPlaceholder',
                      undefined,
                      'Instructions for this task (overrides challenge instructions)'
                    )}
                    className="min-h-24 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'manageTaskEdit.form.instructionsDescription',
                    undefined,
                    'Instructions for users doing this specific task'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="geometries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.geojson', undefined, 'GeoJSON')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{"type":"Point","coordinates":[0,0]}'
                    className="min-h-40 resize-y font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'manageTaskEdit.form.geoJsonDescription',
                    undefined,
                    'GeoJSON for this task (point, line or polygon). Must be valid JSON.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.status', undefined, 'Status')}</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'manageTaskEdit.form.statusPlaceholder',
                          undefined,
                          'Select status'
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t(
                    'manageTaskEdit.form.statusDescription',
                    undefined,
                    'Current status of the task'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="errorTags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.mrTags', undefined, 'MR Tags')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'manageTaskEdit.form.mrTagsPlaceholder',
                      undefined,
                      'tag1, tag2'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'manageTaskEdit.form.mrTagsDescription',
                    undefined,
                    'Optional MR tags to annotate this task (comma-separated)'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button type="submit" disabled={formSubmitDisabled(form.formState)}>
            {form.formState.isSubmitting
              ? t('common.saving2', undefined, 'Saving...')
              : t('common.save', undefined, 'Save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
