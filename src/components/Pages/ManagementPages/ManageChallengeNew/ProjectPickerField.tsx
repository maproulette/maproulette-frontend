import { ProjectPickerButton } from '@/components/shared/ProjectPickerButton'
import { ProjectPickerModal } from '@/components/shared/ProjectPickerModal'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { useIntl } from '@/i18n'

interface ProjectPickerFieldProps {
  value: number
  onChange: (value: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Fetching the currently selected project lets the picker show its name even
// when it's outside the modal's first page of results (the previous Select
// silently dropped any project beyond the first batch).
export const ProjectPickerField = ({
  value,
  onChange,
  open,
  onOpenChange,
}: ProjectPickerFieldProps) => {
  const { t } = useIntl()

  return (
    <FormItem>
      <FormLabel>{t('common.project', undefined, 'Project')}</FormLabel>
      <FormControl>
        <ProjectPickerButton projectId={value} onClick={() => onOpenChange(true)} />
      </FormControl>
      <FormDescription>
        {t(
          'manageChallengeNew.challengeForm.projectPicker.description',
          undefined,
          'Select the project this challenge belongs to'
        )}
      </FormDescription>
      <FormMessage />
      <ProjectPickerModal
        open={open}
        onOpenChange={onOpenChange}
        selectedProjectId={value > 0 ? value : undefined}
        onSelectProject={(project) => {
          if (project.id != null) onChange(project.id)
        }}
      />
    </FormItem>
  )
}
