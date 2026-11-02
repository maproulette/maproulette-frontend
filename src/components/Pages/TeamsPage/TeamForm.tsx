import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import {
  isUploadedTeamAvatarUrl,
  resolveTeamImageUrl,
  TEAM_IMAGE_ACCEPT,
  TEAM_IMAGE_MAX_BYTES,
  teamImageFileProblem,
} from '@/lib/teamImage'
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
  const uploadAvatar = api.team.useUploadAvatar()
  const deleteAvatar = api.team.useDeleteAvatar()

  // An avatar the team uploaded is served from a url of ours. It is edited by
  // uploading, not by typing, so it is kept out of the url field entirely.
  const uploadedAvatarURL =
    team && isUploadedTeamAvatarUrl(team.avatarURL, team.id) ? team.avatarURL : undefined

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [removeUploaded, setRemoveUploaded] = useState(false)
  const [pendingPreview, setPendingPreview] = useState<string>()

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name ?? '',
      description: team?.description ?? '',
      avatarURL: uploadedAvatarURL ? '' : (team?.avatarURL ?? ''),
    },
  })

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreview(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(pendingFile)
    setPendingPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingFile])

  const typedURL = form.watch('avatarURL')
  const fileProblem = pendingFile ? teamImageFileProblem(pendingFile, t) : undefined
  const avatarChanged = !!pendingFile || removeUploaded

  const currentAvatarURL = removeUploaded ? undefined : uploadedAvatarURL
  const previewSrc = pendingPreview ?? resolveTeamImageUrl(typedURL || currentAvatarURL)

  // Uploading and linking are alternatives, so choosing one clears the other
  // rather than leaving two sources of truth for a single avatar.
  const handleFileChosen = (file: File | null) => {
    setPendingFile(file)
    if (file) {
      form.setValue('avatarURL', '')
      setRemoveUploaded(false)
    }
  }

  const handleRemoveAvatar = () => {
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    form.setValue('avatarURL', '', { shouldDirty: true })
    if (uploadedAvatarURL) setRemoveUploaded(true)
  }

  const onSubmit = async (values: TeamFormValues) => {
    if (fileProblem) return

    // An uploaded avatar's url is not in the form, so a save that didn't touch
    // the avatar has to carry it through - otherwise editing just the name
    // would clear the avatar.
    const keepUploaded = uploadedAvatarURL && !removeUploaded && !pendingFile
    const payload = {
      name: values.name,
      description: values.description || undefined,
      avatarURL: values.avatarURL || (keepUploaded ? uploadedAvatarURL : undefined),
    }

    let saved: Team
    try {
      saved = team
        ? await update.mutateAsync({ teamId: team.id, payload })
        : await create.mutateAsync(payload)
    } catch (error) {
      logger.error('Team save failed', { error })
      toast.error(t({ id: 'teams.form.saveError', defaultMessage: 'Could not save team' }))
      return
    }

    // The upload sets the team's avatar url itself, so it has to run after the
    // save - a save carrying the previous url would undo it.
    try {
      if (pendingFile) {
        await uploadAvatar.mutateAsync({ teamId: saved.id, imageFile: pendingFile })
      } else if (removeUploaded && uploadedAvatarURL) {
        await deleteAvatar.mutateAsync(saved.id)
      }
    } catch (error) {
      logger.error('Team avatar save failed', { error })
      // The team itself saved, so this stays on the form for a retry rather
      // than navigating away as though everything worked.
      toast.error(
        t({ id: 'teams.form.avatarError', defaultMessage: 'Team saved, but its avatar could not be updated' })
      )
      return
    }

    toast.success(
      team
        ? t({ id: 'teams.form.updateSuccess', defaultMessage: 'Team updated' })
        : t({ id: 'teams.form.createSuccess', defaultMessage: 'Team created' })
    )
    navigate({ to: '/teams/$teamId', params: { teamId: String(saved.id) } })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="absolute inset-0 flex min-h-0 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <FormSection
            title={t({ id: 'teams.form.detailsSectionTitle', defaultMessage: 'Team details' })}
            description={t({ id: 'teams.form.detailsSectionDescription', defaultMessage: 'Basic identifying information for this team.' }
            )}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t({ id: 'common.name', defaultMessage: 'Name' })}</FormLabel>
                  <FormControl>
                    <Input autoFocus maxLength={100} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'teams.form.nameDescription', defaultMessage: 'The unique name of the team' })}
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
                    <Textarea rows={4} maxLength={1000} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'teams.form.descriptionDescription', defaultMessage: 'A brief description of the team' }
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{t({ id: 'teams.form.avatarLabel', defaultMessage: 'Avatar (optional)' })}</FormLabel>
              <div className="flex items-start gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-slate-800">
                  {previewSrc ? (
                    <img src={previewSrc} alt="" className="size-full object-cover" />
                  ) : (
                    <ImagePlus
                      className="size-5 text-zinc-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={TEAM_IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
                    aria-label={t({ id: 'teams.form.avatarFileLabel', defaultMessage: 'Avatar image file' })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={form.formState.isSubmitting}
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      {previewSrc
                        ? t({ id: 'teams.form.avatarReplace', defaultMessage: 'Replace image' })
                        : t({ id: 'teams.form.avatarUpload', defaultMessage: 'Upload image' })}
                    </Button>
                    {previewSrc ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveAvatar}
                        disabled={form.formState.isSubmitting}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t({ id: 'common.remove', defaultMessage: 'Remove' })}
                      </Button>
                    ) : null}
                  </div>
                  <p
                    className={
                      fileProblem
                        ? 'text-red-600 text-xs dark:text-red-400'
                        : 'text-xs text-zinc-500 dark:text-slate-400'
                    }
                  >
                    {fileProblem ??
                      (pendingFile
                        ? t({ id: 'teams.form.avatarPending', defaultMessage: '{name} will be uploaded when you save' }, { name: pendingFile.name }
                          )
                        : t({ id: 'teams.form.avatarHint', defaultMessage: 'PNG, JPEG, WebP or GIF, up to {max}MB. Square images look best.' }, { max: TEAM_IMAGE_MAX_BYTES / (1024 * 1024) }
                          ))}
                  </p>
                </div>
              </div>
            </FormItem>
            <FormField
              control={form.control}
              name="avatarURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t({ id: 'teams.form.avatarUrlLabel', defaultMessage: 'Or link to an image' })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://…"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (e.target.value) handleFileChosen(null)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t({ id: 'teams.form.avatarUrlDescription', defaultMessage: 'An image URL to represent the team, if you would rather link one than upload it' }
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
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            disabled={
              formSubmitDisabled({
                isSubmitting: form.formState.isSubmitting,
                // Choosing or clearing an image is a change the form fields
                // themselves don't register, so it counts as dirty here.
                isDirty: form.formState.isDirty || avatarChanged,
              }) || !!fileProblem
            }
          >
            {team
              ? t({ id: 'common.save', defaultMessage: 'Save' })
              : t({ id: 'common.createTeam', defaultMessage: 'Create team' })}
          </Button>
        </div>
      </form>
    </Form>
  )
}
