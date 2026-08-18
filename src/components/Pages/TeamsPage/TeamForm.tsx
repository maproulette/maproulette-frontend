import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '@/api'
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
import { FormSection } from '@/components/ui/FormSection'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { Team } from '@/types/Team'
import { type TeamFormValues, teamFormSchema } from './teamSchema'

interface Props {
  team?: Team
}

export const TeamForm = ({ team }: Props) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const create = api.team.useCreateTeam()
  const update = api.team.useUpdateTeam()

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name ?? '',
      description: team?.description ?? '',
      avatarURL: team?.avatarURL ?? '',
    },
  })

  const onSubmit = async (values: TeamFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      avatarURL: values.avatarURL || undefined,
    }
    try {
      const result = team
        ? await update.mutateAsync({ teamId: team.id, payload })
        : await create.mutateAsync(payload)
      toast.success(
        team
          ? t('teams.form.updateSuccess', undefined, 'Team updated')
          : t('teams.form.createSuccess', undefined, 'Team created')
      )
      navigate({ to: '/teams/$teamId', params: { teamId: String(result.id) } })
    } catch (error) {
      logger.error('Team save failed', { error })
      toast.error(t('teams.form.saveError', undefined, 'Could not save team'))
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <FormSection
            title={t('teams.form.detailsSectionTitle', undefined, 'Team details')}
            description={t(
              'teams.form.detailsSectionDescription',
              undefined,
              'Basic identifying information for this team.'
            )}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name', undefined, 'Name')}</FormLabel>
                  <FormControl>
                    <Input autoFocus maxLength={100} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('teams.form.nameDescription', undefined, 'The unique name of the team')}
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
                  <FormLabel>{t('common.description', undefined, 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={4} maxLength={1000} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'teams.form.descriptionDescription',
                      undefined,
                      'A brief description of the team'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('teams.form.avatarUrlLabel', undefined, 'Avatar URL (optional)')}
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'teams.form.avatarUrlDescription',
                      undefined,
                      'An image URL to represent the team'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </div>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-3 border-zinc-200 border-t pt-4 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/dashboard' })}
            disabled={form.formState.isSubmitting}
          >
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button type="submit" disabled={formSubmitDisabled(form.formState)}>
            {team
              ? t('common.save', undefined, 'Save')
              : t('common.createTeam', undefined, 'Create team')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
