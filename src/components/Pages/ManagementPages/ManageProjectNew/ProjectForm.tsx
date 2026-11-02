import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { FormSection, FormSectionGroup } from '@/components/ui/FormSection'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import type { Project } from '@/types/Project'
import { ProjectTeamSection } from './ProjectTeamSection'
import { makeProjectFormSchema, type ProjectFormValues } from './projectFormSchema'

export type { ProjectFormValues } from './projectFormSchema'

interface ProjectFormProps {
  project?: Project
  onSubmit: (values: ProjectFormValues) => Promise<void>
  onCancel: () => void
}

export const ProjectForm = ({ project, onSubmit, onCancel }: ProjectFormProps) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const canSetFeatured = isSuperUser(user)

  const resolver = useMemo(() => zodResolver(makeProjectFormSchema(t)), [t])

  const form = useForm<ProjectFormValues>({
    resolver,
    defaultValues: {
      name: project?.name || '',
      displayName: project?.displayName || '',
      description: project?.description || '',
      enabled: project?.enabled ?? true,
      featured: project?.featured ?? false,
      ownerTeamId: project?.ownerTeamId ?? null,
    },
  })

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await onSubmit(values)
      toast.success(
        project
          ? t({ id: 'manageProjectNew.projectForm.updateSuccessToast', defaultMessage: 'Project updated successfully' }
            )
          : t({ id: 'manageProjectNew.projectForm.createSuccessToast', defaultMessage: 'Project created successfully' }
            )
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t({ id: 'manageProjectNew.projectForm.saveErrorToast', defaultMessage: 'Failed to save project. Please try again.' }
            )
      toast.error(errorMessage)
      logger.error('Failed to save project', { error })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        <FormSectionGroup className="min-h-0 flex-1 overflow-y-auto pr-1">
          <FormSection
            title={t({ id: 'manageProjectNew.projectForm.detailsSectionTitle', defaultMessage: 'Project details' }
            )}
            description={t({ id: 'manageProjectNew.projectForm.detailsSectionDescription', defaultMessage: 'Basic identifying information for this project.' }
            )}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t({ id: 'manageProjectNew.projectForm.nameLabel', defaultMessage: 'Project Name' })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t({ id: 'manageProjectNew.projectForm.namePlaceholder', defaultMessage: 'my-project' }
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'manageProjectNew.projectForm.nameDescription', defaultMessage: 'A unique identifier for the project (lowercase, no spaces)' }
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t({ id: 'manageProjectNew.projectForm.displayNameLabel', defaultMessage: 'Display Name' })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t({ id: 'manageProjectNew.projectForm.displayNamePlaceholder', defaultMessage: 'My Project' }
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'manageProjectNew.projectForm.displayNameDescription', defaultMessage: 'The display name shown to users' }
                    )}
                  </FormDescription>
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
                      placeholder={t({ id: 'manageProjectNew.projectForm.descriptionPlaceholder', defaultMessage: 'Describe what this project is about...' }
                      )}
                      className="min-h-32 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'manageProjectNew.projectForm.descriptionDescription', defaultMessage: 'A brief description of the project' }
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title={t({ id: 'manageProjectNew.projectForm.visibilitySectionTitle', defaultMessage: 'Visibility' }
            )}
            description={t({ id: 'manageProjectNew.projectForm.visibilitySectionDescription', defaultMessage: 'Control how this project appears across MapRoulette.' }
            )}
          >
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t({ id: 'common.enabled', defaultMessage: 'Enabled' })}
                    </FormLabel>
                    <FormDescription>
                      {t({ id: 'manageProjectNew.projectForm.enabledDescription', defaultMessage: 'Make this project visible and accessible to users' }
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {canSetFeatured && (
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t({ id: 'common.featured', defaultMessage: 'Featured' })}
                      </FormLabel>
                      <FormDescription>
                        {t({ id: 'manageProjectNew.projectForm.featuredDescription', defaultMessage: 'Feature this project on the homepage' }
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </FormSection>

          <ProjectTeamSection />
        </FormSectionGroup>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button type="submit" disabled={formSubmitDisabled(form.formState)}>
            {form.formState.isSubmitting
              ? t({ id: 'common.saving2', defaultMessage: 'Saving...' })
              : project
                ? t({ id: 'manageProjectNew.projectForm.updateButton', defaultMessage: 'Update Project' })
                : t({ id: 'common.createProject', defaultMessage: 'Create Project' })}
          </Button>
        </div>
      </form>
    </Form>
  )
}
